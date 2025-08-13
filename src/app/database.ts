"use server";

import sqlite3 from "sqlite3";
import { patientsTable, doctorsTable, admissionsTable, provinceNamesTable } from "./constants";

const db = new sqlite3.Database(":memory:");

export async function seed() {
  db.serialize(() => {
    db.run(`PRAGMA foreign_keys = ON;`);

    // Create tables if they don't exist
    db.run(provinceNamesTable);
    db.run(patientsTable);
    db.run(doctorsTable);
    db.run(admissionsTable);

    // Clear old data to avoid FK & PK conflicts
    db.run(`DELETE FROM admissions`);
    db.run(`DELETE FROM patients`);
    db.run(`DELETE FROM doctors`);
    db.run(`DELETE FROM province_names`);

    // Insert provinces
    db.run(`
      INSERT INTO province_names (province_id, province_name) VALUES
      ('ON', 'Ontario'),
      ('BC', 'British Columbia'),
      ('QC', 'Quebec'),
      ('AB', 'Alberta'),
      ('MB', 'Manitoba'),
      ('NS', 'Nova Scotia'),
      ('NB', 'New Brunswick'),
      ('SK', 'Saskatchewan'),
      ('NL', 'Newfoundland and Labrador'),
      ('PE', 'Prince Edward Island')
    `);

    // Insert patients (apostrophes escaped)
    db.run(`
      INSERT INTO patients (patient_id, first_name, last_name, gender, birth_date, city, province_id, allergies, height, weight) VALUES
      (1, 'John', 'Doe', 'M', '1985-06-15', 'Toronto', 'ON', 'Peanuts', 180, 75),
      (2, 'Jane', 'Smith', 'F', '1990-09-25', 'Vancouver', 'BC', NULL, 165, 60),
      (3, 'Michael', 'Lee', 'M', '1978-03-12', 'Montreal', 'QC', 'Penicillin', 175, 82),
      (4, 'Sara', 'Khan', 'F', '1982-12-01', 'Calgary', 'AB', 'Seafood', 160, 55),
      (5, 'Daniel', 'Martinez', 'M', '1995-07-22', 'Winnipeg', 'MB', NULL, 170, 68),
      (6, 'Emily', 'Brown', 'F', '2000-04-14', 'Ottawa', 'ON', 'Latex', 158, 50),
      (7, 'Liam', 'Thompson', 'M', '1988-01-05', 'Halifax', 'NS', 'Dust', 182, 85),
      (8, 'Olivia', 'White', 'F', '1993-02-18', 'Fredericton', 'NB', NULL, 168, 59),
      (9, 'Noah', 'Clark', 'M', '1986-08-29', 'Regina', 'SK', 'Shellfish', 177, 72),
      (10, 'Ava', 'Lewis', 'F', '1999-11-10', 'St. John''s', 'NL', NULL, 162, 58),
      (11, 'Ethan', 'Hall', 'M', '1975-05-25', 'Charlottetown', 'PE', 'Pollen', 181, 77),
      (12, 'Sophia', 'Allen', 'F', '2001-03-15', 'Toronto', 'ON', 'None', 155, 48),
      (13, 'Benjamin', 'Wright', 'M', '1983-10-07', 'Montreal', 'QC', NULL, 176, 74),
      (14, 'Charlotte', 'Scott', 'F', '1997-12-23', 'Vancouver', 'BC', 'Nuts', 164, 54),
      (15, 'Lucas', 'King', 'M', '1992-04-30', 'Calgary', 'AB', NULL, 179, 80)
    `);

    // Insert doctors
    db.run(`
      INSERT INTO doctors (doctor_id, first_name, last_name, specialty) VALUES
      (1, 'Alice', 'Brown', 'Cardiology'),
      (2, 'David', 'Wilson', 'Neurology'),
      (3, 'Rachel', 'Adams', 'Orthopedics'),
      (4, 'James', 'Taylor', 'Pediatrics'),
      (5, 'Sophia', 'Nguyen', 'Dermatology'),
      (6, 'Henry', 'Moore', 'General Surgery'),
      (7, 'Isabella', 'Harris', 'Oncology'),
      (8, 'Mason', 'Clark', 'Psychiatry'),
      (9, 'Mia', 'Lewis', 'Endocrinology'),
      (10, 'William', 'Walker', 'Gastroenterology')
    `);

    // Insert admissions (references existing patient & doctor IDs)
    db.run(`
      INSERT INTO admissions (patient_id, admission_date, discharge_date, diagnosis, attending_doctor_id) VALUES
      (1, '2025-08-01', '2025-08-05', 'Heart disease', 1),
      (2, '2025-08-03', NULL, 'Migraine', 2),
      (3, '2025-07-15', '2025-07-20', 'Fractured arm', 3),
      (4, '2025-06-10', '2025-06-12', 'Food poisoning', 4),
      (5, '2025-08-07', NULL, 'Skin rash', 5),
      (6, '2025-08-01', '2025-08-04', 'Asthma attack', 4),
      (1, '2025-03-05', '2025-03-07', 'Chest pain', 1),
      (3, '2025-05-01', '2025-05-03', 'Concussion', 2),
      (7, '2025-08-02', NULL, 'Pneumonia', 6),
      (8, '2025-07-28', '2025-08-02', 'Breast cancer', 7),
      (9, '2025-06-18', '2025-06-25', 'Depression', 8),
      (10, '2025-05-20', '2025-05-22', 'Diabetes complication', 9),
      (11, '2025-08-09', NULL, 'Stomach ulcer', 10),
      (12, '2025-04-11', '2025-04-14', 'Broken ankle', 3),
      (13, '2025-03-30', '2025-04-05', 'Stroke', 2),
      (14, '2025-02-12', '2025-02-15', 'Eczema flare-up', 5),
      (15, '2025-01-18', '2025-01-21', 'Appendicitis', 6),
      (7, '2024-12-10', '2024-12-15', 'Lung infection', 6),
      (8, '2025-01-05', '2025-01-09', 'Chemotherapy session', 7),
      (9, '2025-02-20', '2025-02-23', 'Anxiety attack', 8)
    `);
  });
}

export async function execute(sql: string) {
  return await new Promise((resolve, reject) => {
    try {
      db.all(sql, (error, result) => {
        if (error) {
          console.log({ error });
          resolve(JSON.stringify(error));
          return;
        }
        console.log({ result });
        resolve(result);
      });
    } catch (e) {
      console.log(e);
      reject(e);
    }
  });
}
