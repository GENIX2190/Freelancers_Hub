-- Mission owner email for applicant notifications (run once).
ALTER TABLE mission
ADD COLUMN contact_email VARCHAR(255) NULL DEFAULT NULL AFTER categorie_id;
