import http.server
import socketserver
import threading
import time
import os
import sys

# Ensure UTF-8 output on Windows
sys.stdout.reconfigure(encoding='utf-8')

from playwright.sync_api import sync_playwright

PORT = 8889
DIRECTORY = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def start_server():
    httpd = socketserver.TCPServer(('', PORT), Handler)
    server_thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    server_thread.start()
    return httpd

def run_tests():
    print(f"Demarrage du serveur local sur http://localhost:{PORT}...")
    httpd = start_server()
    time.sleep(1)

    passed_tests = 0
    total_tests = 0

    def test(name, condition):
        nonlocal passed_tests, total_tests
        total_tests += 1
        if condition:
            print(f"  [PASS] {name}")
            passed_tests += 1
        else:
            print(f"  [FAIL] {name}")

    with sync_playwright() as p:
        browser = p.chromium.launch(channel="msedge", headless=True)
        context = browser.new_context(viewport={"width": 1600, "height": 900})
        page = context.new_page()

        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        page.on("pageerror", lambda err: console_errors.append(str(err)))

        print("Navigation vers http://localhost:8889/index.html...")
        page.goto(f"http://localhost:{PORT}/index.html")
        page.wait_for_load_state("networkidle")
        time.sleep(1)

        # 1. Vérification des erreurs console
        js_errors = [e for e in console_errors if "favicon" not in e and "404" not in e]
        test("Aucune erreur JavaScript au chargement", len(js_errors) == 0)

        # 2. Titre et sous-titre
        h1_text = page.locator("h1").inner_text()
        test("Titre H1 exact 'Commission Enfance Jeunesse Solidarites'", h1_text == "Commission Enfance Jeunesse Solidarités")
        test("Absence du mot 'Prevention' dans le titre", "Prévention" not in h1_text)

        subtitle_text = page.locator(".header-title-group p").inner_text()
        test("Sous-titre avec mention 'pour y etre elus referents'", "pour y être élus référents" in subtitle_text)

        # 3. Retrait des mentions Connecte & Synchronise et Script SQL Supabase
        test("Absence de la mention 'Connecte & Synchronise'", page.locator("text='Connecté & Synchronisé'").count() == 0)
        test("Absence du bouton 'Script SQL Supabase'", page.locator("text='Script SQL Supabase'").count() == 0)

        # 4. l'Envol DSP
        envol_th = page.locator("th[data-structure-id='l-envol']")
        test("Structure l'Envol presente", envol_th.count() == 1)
        dsp_badge = envol_th.locator(".tag-dsp")
        test("Badge DSP present sur l'Envol", dsp_badge.count() == 1 and dsp_badge.inner_text() == "DSP")
        creche_badge = envol_th.locator(".tag-creche")
        test("Badge Creche present sur l'Envol", creche_badge.count() == 1)

        # 5. Oxygene ALSH et Ados
        oxygene_th = page.locator("th[data-structure-id='oxygene']")
        test("Structure Oxygene presente", oxygene_th.count() == 1)
        test("Badge ALSH sur Oxygene", oxygene_th.locator(".tag-alsh").count() == 1)
        test("Badge Ados sur Oxygene", oxygene_th.locator(".tag-ados").count() == 1)

        # 6. Suppression defilement vertical du conteneur tableau
        max_height = page.eval_on_selector(".table-scroll-container", "el => window.getComputedStyle(el).maxHeight")
        test("Tableau sans restriction de hauteur (max-height: none)", max_height == "none")

        # 7. Presence des controles horizontaux
        filter_commune = page.locator("#filterCommune")
        test("Menu deroulant de filtre par commune present", filter_commune.count() == 1)

        quick_pills = page.locator(".quick-pill")
        test("Pastilles d acces rapide par commune presentes (>=8)", quick_pills.count() >= 8)

        btn_scroll_left = page.locator("#btnScrollLeft")
        btn_scroll_right = page.locator("#btnScrollRight")
        test("Boutons de defilement horizontal Gauche et Droite presents", btn_scroll_left.count() == 1 and btn_scroll_right.count() == 1)

        # 8. Test de filtrage par commune (Bas-en-Basset a 3 structures)
        filter_commune.select_option("Bas-en-Basset")
        time.sleep(0.5)
        visible_headers = page.locator("#matrixHead tr:nth-child(2) th").count()
        test("Filtrage commune Bas-en-Basset (3 structures affichees)", visible_headers == 3)

        # Restauration toutes les communes
        filter_commune.select_option("all")
        time.sleep(0.5)
        total_structures = page.locator("#matrixHead tr:nth-child(2) th").count()
        test("Restauration complete (20 structures affichees)", total_structures == 20)

        # 9. Test interactif d attribution d un vote (coche) sur un élu vierge de votes
        fresh_row = page.locator("tbody tr:not(:has(.vote-badge))").first
        elu_target = fresh_row.get_attribute("data-elu-name")
        clickable_cell = fresh_row.locator(".matrix-cell:not(.cell-blocked):not(.cell-selected):not(.cell-full)").first
        struct_target = clickable_cell.get_attribute("data-structure")

        clickable_cell.click()
        time.sleep(0.5)
        badge = page.locator(f".matrix-cell[data-elu='{elu_target}'][data-structure='{struct_target}'] .vote-badge")
        test("Attribution du vote avec coche reussie au clic", badge.count() == 1 and "Voté" in badge.inner_text())

        # 9. Test du dialogue de confirmation de retrait du vote
        badge.click()
        time.sleep(0.5)
        confirm_modal = page.locator("#confirmReleaseModal")
        test("Modale de confirmation de retrait affichee au clic sur son vote", confirm_modal.is_visible())
        
        # Test du bouton Annuler (conserver le vote)
        btn_cancel = page.locator("#btnCancelRelease")
        btn_cancel.click()
        time.sleep(0.5)
        test("Modale fermee apres clic sur Annuler", not confirm_modal.is_visible())
        test("Vote toujours conserve apres Annuler", page.locator(f".matrix-cell[data-elu='{elu_target}'][data-structure='{struct_target}'] .vote-badge").count() == 1)

        # Test de confirmation effective du retrait de vote
        badge.click()
        time.sleep(0.5)
        btn_confirm = page.locator("#btnConfirmRelease")
        btn_confirm.click()
        time.sleep(0.5)
        badge_after = page.locator(f".matrix-cell[data-elu='{elu_target}'][data-structure='{struct_target}'] .vote-badge")
        test("Retrait du vote effectif apres confirmation", badge_after.count() == 0)

        # 9 bis. Test de structure déjà complète (ex: Les Marmousets compte 2 votes : GAMEIRO Isabelle & VERDY Sandrine)
        th_full = page.locator("th.th-structure.structure-full").first
        full_struct_name = th_full.locator(".structure-name").inner_text()
        test("En-tete d'une structure complete verrouille avec badge 'Complet (2/2)'", th_full.count() >= 1 and "Complet (2/2)" in th_full.inner_text())

        # Cellule d'un élu tiers sur cette structure complète doit être .cell-full
        other_elu_row = page.locator("tbody tr[data-elu-name='DUPLAIN Jocelyne']")
        cell_full = other_elu_row.locator(f".matrix-cell[data-structure=\"{full_struct_name}\"]")
        test("Cellule de la structure complete grisee .cell-full pour un autre elu", "cell-full" in (cell_full.get_attribute("class") or ""))

        # Tentative de clic sur cette structure complète -> toast d'avertissement et aucun ajout
        cell_full.click()
        time.sleep(0.3)
        toast_full = page.locator(".toast.warn")
        test("Tentative de vote sur structure complete bloquee avec alerte", toast_full.count() >= 1 and "complète" in toast_full.last.inner_text())

        # 9 ter. Test que l'élu peut voter pour plus de 2 structures (pas de limite par élu)
        test_row = page.locator("tbody tr:not(:has(.vote-badge))").first
        test_elu = test_row.get_attribute("data-elu-name")
        
        # Vote 1
        page.locator(f"tr[data-elu-name='{test_elu}'] .matrix-cell:not(.cell-blocked):not(.cell-selected):not(.cell-full)").first.click()
        time.sleep(0.3)
        # Vote 2
        page.locator(f"tr[data-elu-name='{test_elu}'] .matrix-cell:not(.cell-blocked):not(.cell-selected):not(.cell-full)").first.click()
        time.sleep(0.3)
        # Vote 3 (autorisé sans restriction par élu !)
        page.locator(f"tr[data-elu-name='{test_elu}'] .matrix-cell:not(.cell-blocked):not(.cell-selected):not(.cell-full)").first.click()
        time.sleep(0.3)
        test_badges = page.locator(f"tr[data-elu-name='{test_elu}'] .vote-badge")
        test("Possibilite de voter pour 3 structures sans blocage par elu", test_badges.count() == 3)

        # Nettoyage des 3 votes de test
        while test_badges.count() > 0:
            test_badges.first.click()
            time.sleep(0.3)
            page.locator("#btnConfirmRelease").click()
            time.sleep(0.3)

        # 10. Test de tentative de clic sur cellule bloquee (neutralite)
        blocked_cell = page.locator(".matrix-cell.cell-blocked").first
        blocked_cell.click()
        time.sleep(0.5)
        toast = page.locator(".toast.warn")
        test("Notification d incompatibilite communale affichee sur cellule bloquee", toast.count() >= 1)

        # 11. Test des pastilles d'accès rapide (défilement horizontal fluide)
        page.eval_on_selector(".table-scroll-container", "el => el.scrollLeft = 0")
        time.sleep(0.3)
        initial_scroll = page.eval_on_selector(".table-scroll-container", "el => el.scrollLeft")
        test("Position initiale de defilement horizontal a 0", initial_scroll == 0)
        
        # Clic sur une pastille plus loin (ex: Sainte-Sigolène)
        sigolene_pill = page.locator(".quick-pill[data-commune='Sainte-Sigolène']")
        if sigolene_pill.count() > 0:
            sigolene_pill.click()
            time.sleep(1)
            new_scroll = page.eval_on_selector(".table-scroll-container", "el => el.scrollLeft")
            test("Defilement horizontal declenche par clic sur pastille Sainte-Sigolene", new_scroll > 0)

        # 12. Test du bouton Répartition en bas de page (NON flottant) et modale
        btn_lock = page.locator("footer #btnOpenRepartitionModal")
        test("Bouton cadenas présent dans le footer en bas de page", btn_lock.count() == 1)

        # Vérifier que le bouton n'est PAS en position fixed (pas flottant sur l'écran)
        btn_position = page.eval_on_selector("#btnOpenRepartitionModal", "el => window.getComputedStyle(el).position")
        test("Bouton non flottant (position !== 'fixed')", btn_position != "fixed")

        # Scroll vers le bas pour le rendre visible
        btn_lock.scroll_into_view_if_needed()
        time.sleep(0.3)
        test("Bouton visible après défilement jusqu'au pied de page", btn_lock.is_visible())

        # Test d'affectation avec respect strict du MAX 3 ÉLUS PAR STRUCTURE
        # On simule via JavaScript 6 élus qui choisissent la même structure en Choix 1 et une autre en Choix 2
        page.evaluate("""() => {
            if (window.app) {
                // Inscrire 5 élus avec choix 1 = "MJC" et choix 2 = "ACIJA"
                const votersData = [
                    { elu_nom: "DUPLAIN Jocelyne", elu_commune: "CC", structure_nom: "MJC", structure_commune: "Monistrol-sur-Loire", choix_rang: 1 },
                    { elu_nom: "DUPLAIN Jocelyne", elu_commune: "CC", structure_nom: "ACIJA", structure_commune: "Monistrol-sur-Loire", choix_rang: 2 },
                    { elu_nom: "BEAU Virginie", elu_commune: "Bas-en-Basset", structure_nom: "MJC", structure_commune: "Monistrol-sur-Loire", choix_rang: 1 },
                    { elu_nom: "BEAU Virginie", elu_commune: "Bas-en-Basset", structure_nom: "ACIJA", structure_commune: "Monistrol-sur-Loire", choix_rang: 2 },
                    { elu_nom: "BERTHET Sarah", elu_commune: "Tiranges", structure_nom: "MJC", structure_commune: "Monistrol-sur-Loire", choix_rang: 1 },
                    { elu_nom: "BERTHET Sarah", elu_commune: "Tiranges", structure_nom: "ACIJA", structure_commune: "Monistrol-sur-Loire", choix_rang: 2 },
                    { elu_nom: "CAPDEVIELLE Florian", elu_commune: "Boisset", structure_nom: "MJC", structure_commune: "Monistrol-sur-Loire", choix_rang: 1 },
                    { elu_nom: "CAPDEVIELLE Florian", elu_commune: "Boisset", structure_nom: "ACIJA", structure_commune: "Monistrol-sur-Loire", choix_rang: 2 },
                    { elu_nom: "CHABANOL Jean-Paul", elu_commune: "Saint-Pal-de-Chalencon", structure_nom: "MJC", structure_commune: "Monistrol-sur-Loire", choix_rang: 1 },
                    { elu_nom: "CHABANOL Jean-Paul", elu_commune: "Saint-Pal-de-Chalencon", structure_nom: "ACIJA", structure_commune: "Monistrol-sur-Loire", choix_rang: 2 }
                ];
                window.app.inscriptions = votersData;
                window.app.updateStats();
            }
        }""")
        time.sleep(0.5)

        # Ouvrir la modale
        btn_lock.click()
        time.sleep(0.5)
        modal = page.locator("#repartitionModal")
        test("Modale de répartition ouverte après clic sur cadenas", modal.is_visible())

        # Vérifier la règle des 3 élus max
        allocation_data = page.evaluate("() => window.app.computeOptimalAllocation()")
        counts = [len(alloc["elus"]) for alloc in allocation_data["structureAllocations"].values()]
        max_count = max(counts) if counts else 0
        test("Plafond strict de 3 élus par structure respecté (max <= 3)", max_count <= 3)

        # Vérifier que la MJC a exactement 3 élus (plafond) et ACIJA a les 2 autres
        mjc_count = len(allocation_data["structureAllocations"]["MJC"]["elus"])
        acija_count = len(allocation_data["structureAllocations"]["ACIJA"]["elus"])
        test("MJC plafonnée à 3 élus maximum", mjc_count == 3)
        test("Surplus correctement redirigé vers ACIJA (2 élus)", acija_count == 2)

        # Vérifier les KPIs
        kpi_bar = page.locator("#repartitionKpiBar")
        test("Barre de KPI affichée dans la modale", kpi_bar.is_visible())
        kpi_items = page.locator("#repartitionKpiBar .repartition-kpi-item")
        test("4 indicateurs KPI présents", kpi_items.count() == 4)

        # Vérifier que les cartes structures sont générées
        struct_cards = page.locator(".repartition-card")
        test("Cartes de structures générées dans la modale (20 structures)", struct_cards.count() == 20)

        # Capture d ecran de la modale ouverte en vue structure
        os.makedirs("test-screenshots", exist_ok=True)
        modal_screenshot_path = os.path.join(DIRECTORY, "test-screenshots", "repartition_modal.png")
        page.screenshot(path=modal_screenshot_path, full_page=False)
        print(f"Capture d ecran modale sauvegardee : {modal_screenshot_path}")

        # Vérifier le basculement vers la vue par Élu
        btn_view_elu = page.locator("#btnViewByElu")
        test("Bouton bascule Vue par Élu présent", btn_view_elu.count() == 1)
        btn_view_elu.click()
        time.sleep(0.4)
        elu_rows = page.locator(".rep-elu-table tbody tr")
        test("Basculement vers la vue par élu réussi", elu_rows.count() > 0)

        # Revenir en vue structure
        btn_view_struct = page.locator("#btnViewByStructure")
        btn_view_struct.click()
        time.sleep(0.4)
        test("Retour en vue par structure réussi", page.locator(".repartition-card").count() == 20)

        # Fermer la modale avec le bouton Fermer du footer
        btn_dismiss_modal = page.locator("#btnDismissRepartitionModal")
        btn_dismiss_modal.click()
        time.sleep(0.3)
        test("Fermeture de la modale réussie", not modal.is_visible())

        # Capture d ecran generale
        screenshot_path = os.path.join(DIRECTORY, "test-screenshots", "interface_overview.png")
        page.screenshot(path=screenshot_path, full_page=False)
        print(f"Capture d ecran sauvegardee : {screenshot_path}")

        browser.close()

    httpd.shutdown()
    print(f"\n=======================================================")
    print(f"BILAN DES TESTS AUTOMATISES NAVIGATEUR : {passed_tests} / {total_tests} REUSSIS")
    print(f"=======================================================")
    return 0 if passed_tests == total_tests else 1

if __name__ == '__main__':
    sys.exit(run_tests())
