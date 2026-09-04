# API Contract: Supabase PostgREST Endpoints

**Service**: Supabase REST API v1  
**Base URL**: `https://bnloivgpihtsxydjkgyc.supabase.co/rest/v1`  
**Table**: `inscriptions_elus_commission_structures`  
**Authentication**: Headers:
- `apikey: <anon_public_key>`
- `Authorization: Bearer <anon_public_key>`

---

## 1. Récupération de tous les vœux

- **Endpoint**: `GET /inscriptions_elus_commission_structures`
- **Query Params**: `select=*&order=elu_nom.asc,choix_rang.asc`
- **Headers**:
  ```http
  Accept: application/json
  ```
- **Response 200 OK**:
  ```json
  [
    {
      "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "elu_nom": "BEAU Virginie",
      "elu_commune": "Bas-en-Basset",
      "structure_nom": "MJC",
      "structure_commune": "Monistrol-sur-Loire",
      "choix_rang": 1,
      "created_at": "2026-09-04T15:00:00Z",
      "updated_at": "2026-09-04T15:00:00Z"
    }
  ]
  ```

---

## 2. Enregistrement d'un nouveau vœu

- **Endpoint**: `POST /inscriptions_elus_commission_structures`
- **Headers**:
  ```http
  Content-Type: application/json
  Prefer: return=representation
  ```
- **Payload**:
  ```json
  {
    "elu_nom": "BEAU Virginie",
    "elu_commune": "Bas-en-Basset",
    "structure_nom": "MJC",
    "structure_commune": "Monistrol-sur-Loire",
    "choix_rang": 1
  }
  ```
- **Response 201 Created**:
  ```json
  [
    {
      "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "elu_nom": "BEAU Virginie",
      "elu_commune": "Bas-en-Basset",
      "structure_nom": "MJC",
      "structure_commune": "Monistrol-sur-Loire",
      "choix_rang": 1,
      "created_at": "2026-09-04T15:00:00Z"
    }
  ]
  ```

---

## 3. Suppression d'un vœu (Désélection)

- **Endpoint**: `DELETE /inscriptions_elus_commission_structures`
- **Query Params**: `elu_nom=eq.BEAU%20Virginie&structure_nom=eq.MJC`
- **Headers**:
  ```http
  Prefer: return=representation
  ```
- **Response 200 OK** (ou 204 No Content).

---

## 4. Réindexation des choix après suppression

- **Endpoint**: `PATCH /inscriptions_elus_commission_structures`
- **Query Params**: `id=eq.<id>`
- **Payload**:
  ```json
  {
    "choix_rang": 2
  }
  ```
- **Response 200 OK**.
