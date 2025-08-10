-- schema.sql - Save this in your server directory

-- Rental Applications Table
CREATE TABLE rental_applications (
    id SERIAL PRIMARY KEY,
    application_number VARCHAR(20) UNIQUE NOT NULL,
    
    -- Personal Information
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    
    -- Current Address Information
    current_address TEXT NOT NULL,
    current_address_duration VARCHAR(100) NOT NULL,
    reason_for_moving TEXT NOT NULL,
    
    -- Employment Information
    employer_name VARCHAR(255) NOT NULL,
    job_title VARCHAR(255) NOT NULL,
    employer_address TEXT NOT NULL,
    employer_phone VARCHAR(20) NOT NULL,
    employment_length VARCHAR(100) NOT NULL,
    monthly_gross_income DECIMAL(10,2) NOT NULL,
    other_income_sources TEXT,
    
    -- Previous Address Information
    previous_address TEXT,
    previous_landlord_name VARCHAR(255),
    previous_landlord_contact VARCHAR(255),
    reason_for_leaving TEXT,
    late_rent_history BOOLEAN DEFAULT FALSE,
    
    -- References
    reference_name VARCHAR(255) NOT NULL,
    reference_relationship VARCHAR(100) NOT NULL,
    reference_contact VARCHAR(255) NOT NULL,
    
    -- Household Information
    number_of_occupants INTEGER NOT NULL DEFAULT 1,
    has_pets BOOLEAN DEFAULT FALSE,
    pet_details TEXT,
    has_vehicles BOOLEAN DEFAULT FALSE,
    vehicle_details TEXT,
    
    -- Background Information
    ever_evicted BOOLEAN DEFAULT FALSE,
    eviction_details TEXT,
    criminal_conviction BOOLEAN DEFAULT FALSE,
    conviction_details TEXT,
    
    -- Application Details
    desired_move_in_date DATE NOT NULL,
    background_check_consent BOOLEAN NOT NULL DEFAULT FALSE,
    signature_data TEXT,
    date_signed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- System Fields
    property_id INTEGER,
    landlord_id INTEGER,
    application_status VARCHAR(20) DEFAULT 'pending',
    ai_score DECIMAL(5,2),
    ai_score_breakdown JSONB,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

-- Indexes
CREATE INDEX idx_rental_applications_email ON rental_applications(email);
CREATE INDEX idx_rental_applications_application_number ON rental_applications(application_number);
CREATE INDEX idx_rental_applications_status ON rental_applications(application_status);
CREATE INDEX idx_rental_applications_property_id ON rental_applications(property_id);
CREATE INDEX idx_rental_applications_landlord_id ON rental_applications(landlord_id);
CREATE INDEX idx_rental_applications_created_at ON rental_applications(created_at);

-- Application Documents Table
CREATE TABLE application_documents (
    id SERIAL PRIMARY KEY,
    application_id INTEGER REFERENCES rental_applications(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Application Activity Log
CREATE TABLE application_activity_log (
    id SERIAL PRIMARY KEY,
    application_id INTEGER REFERENCES rental_applications(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    actor_type VARCHAR(20),
    actor_id INTEGER,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Functions and Triggers
CREATE OR REPLACE FUNCTION generate_application_number() RETURNS VARCHAR(20) AS $$
DECLARE
    new_number VARCHAR(20);
    counter INTEGER := 0;
BEGIN
    LOOP
        new_number := 'APP' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD((EXTRACT(EPOCH FROM NOW())::INTEGER % 10000)::TEXT, 4, '0');
        
        IF NOT EXISTS (SELECT 1 FROM rental_applications WHERE application_number = new_number) THEN
            RETURN new_number;
        END IF;
        
        counter := counter + 1;
        IF counter > 100 THEN
            RAISE EXCEPTION 'Unable to generate unique application number';
        END IF;
        
        PERFORM pg_sleep(0.001);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_application_number() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.application_number IS NULL OR NEW.application_number = '' THEN
        NEW.application_number := generate_application_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_application_number
    BEFORE INSERT ON rental_applications
    FOR EACH ROW EXECUTE FUNCTION set_application_number();

CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_application_timestamp
    BEFORE UPDATE ON rental_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();