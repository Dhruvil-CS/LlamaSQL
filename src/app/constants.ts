export const patientsTable = `
CREATE TABLE IF NOT EXISTS patients (
    patient_id INTEGER PRIMARY KEY,
    first_name VARCHAR(30) NOT NULL,
    last_name VARCHAR(30) NOT NULL,
    gender CHAR(1) NOT NULL,
    birth_date DATE NOT NULL,
    city VARCHAR(30),
    province_id CHAR(2),
    allergies VARCHAR(80),
    height DECIMAL(3,0),
    weight DECIMAL(4,0),
    FOREIGN KEY (province_id) REFERENCES province_names(province_id)
);`;

export const doctorsTable = `
CREATE TABLE IF NOT EXISTS doctors (
    doctor_id INTEGER PRIMARY KEY,
    first_name VARCHAR(30) NOT NULL,
    last_name VARCHAR(30) NOT NULL,
    specialty VARCHAR(25)
);`;

export const admissionsTable = `
CREATE TABLE IF NOT EXISTS admissions (
    patient_id INTEGER NOT NULL,
    admission_date DATE NOT NULL,
    discharge_date DATE,
    diagnosis VARCHAR(50),
    attending_doctor_id INTEGER,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id),
    FOREIGN KEY (attending_doctor_id) REFERENCES doctors(doctor_id)
);`;

export const provinceNamesTable = `
CREATE TABLE IF NOT EXISTS province_names (
    province_id CHAR(2) PRIMARY KEY,
    province_name VARCHAR(30) NOT NULL
);`;
