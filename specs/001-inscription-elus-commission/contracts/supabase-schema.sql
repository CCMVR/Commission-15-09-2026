-- ====================================================================
-- SCRIPT DE CRÉATION NON-DESTRUCTIF POUR SUPABASE
-- Projet : Inscription des élus aux structures Enfance-Jeunesse
-- Collectivité : Marches du Velay Rochebaron
-- ====================================================================
-- ATTENTION : Ce script n'exécute aucun DROP TABLE et n'altère aucune
-- table existante dans votre instance Supabase.
-- ====================================================================

-- 1. Création de la table dédiée au projet
CREATE TABLE IF NOT EXISTS public.inscriptions_elus_commission_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    elu_nom TEXT NOT NULL,
    elu_commune TEXT NOT NULL,
    structure_nom TEXT NOT NULL,
    structure_commune TEXT NOT NULL,
    choix_rang INTEGER NOT NULL CHECK (choix_rang BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_elu_structure UNIQUE (elu_nom, structure_nom),
    CONSTRAINT unique_elu_rang UNIQUE (elu_nom, choix_rang)
);

-- 2. Index de performance pour les requêtes rapides par élu et par structure
CREATE INDEX IF NOT EXISTS idx_inscriptions_elu 
    ON public.inscriptions_elus_commission_structures (elu_nom);

CREATE INDEX IF NOT EXISTS idx_inscriptions_structure 
    ON public.inscriptions_elus_commission_structures (structure_nom);

-- 3. Activation de la sécurité Row Level Security (RLS)
ALTER TABLE public.inscriptions_elus_commission_structures ENABLE ROW LEVEL SECURITY;

-- 4. Politiques RLS ouvertes pour la clé publique 'anon'
-- (Adapté pour une utilisation fluide en commission sans login individuel)

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'inscriptions_elus_commission_structures' 
        AND policyname = 'lecture_publique_inscriptions'
    ) THEN
        CREATE POLICY "lecture_publique_inscriptions" 
            ON public.inscriptions_elus_commission_structures 
            FOR SELECT 
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'inscriptions_elus_commission_structures' 
        AND policyname = 'insertion_publique_inscriptions'
    ) THEN
        CREATE POLICY "insertion_publique_inscriptions" 
            ON public.inscriptions_elus_commission_structures 
            FOR INSERT 
            WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'inscriptions_elus_commission_structures' 
        AND policyname = 'modification_publique_inscriptions'
    ) THEN
        CREATE POLICY "modification_publique_inscriptions" 
            ON public.inscriptions_elus_commission_structures 
            FOR UPDATE 
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'inscriptions_elus_commission_structures' 
        AND policyname = 'suppression_publique_inscriptions'
    ) THEN
        CREATE POLICY "suppression_publique_inscriptions" 
            ON public.inscriptions_elus_commission_structures 
            FOR DELETE 
            USING (true);
    END IF;
END $$;
