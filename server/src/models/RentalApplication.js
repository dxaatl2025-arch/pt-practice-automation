// server/src/models/RentalApplication.js
const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRESQL_URI,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

class RentalApplication {
  static async create(applicationData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const query = `
        INSERT INTO rental_applications (
          full_name, date_of_birth, email, phone,
          current_address, current_address_duration, reason_for_moving,
          employer_name, job_title, employer_address, employer_phone,
          employment_length, monthly_gross_income, other_income_sources,
          previous_address, previous_landlord_name, previous_landlord_contact,
          reason_for_leaving, late_rent_history,
          reference_name, reference_relationship, reference_contact,
          number_of_occupants, has_pets, pet_details, has_vehicles, vehicle_details,
          ever_evicted, eviction_details, criminal_conviction, conviction_details,
          desired_move_in_date, background_check_consent, signature_data,
          property_id, landlord_id, ip_address, user_agent
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
          $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
          $31, $32, $33, $34, $35, $36, $37, $38
        )
        RETURNING *
      `;

      const values = [
        applicationData.fullName,
        applicationData.dateOfBirth,
        applicationData.email,
        applicationData.phone,
        applicationData.currentAddress,
        applicationData.currentAddressDuration,
        applicationData.reasonForMoving,
        applicationData.employerName,
        applicationData.jobTitle,
        applicationData.employerAddress,
        applicationData.employerPhone,
        applicationData.employmentLength,
        applicationData.monthlyGrossIncome,
        applicationData.otherIncomeSources || null,
        applicationData.previousAddress || null,
        applicationData.previousLandlordName || null,
        applicationData.previousLandlordContact || null,
        applicationData.reasonForLeaving || null,
        applicationData.lateRentHistory || false,
        applicationData.referenceName,
        applicationData.referenceRelationship,
        applicationData.referenceContact,
        applicationData.numberOfOccupants || 1,
        applicationData.hasPets || false,
        applicationData.petDetails || null,
        applicationData.hasVehicles || false,
        applicationData.vehicleDetails || null,
        applicationData.everEvicted || false,
        applicationData.evictionDetails || null,
        applicationData.criminalConviction || false,
        applicationData.convictionDetails || null,
        applicationData.desiredMoveInDate,
        applicationData.backgroundCheckConsent || false,
        applicationData.signatureData || null,
        applicationData.propertyId || null,
        applicationData.landlordId || null,
        applicationData.ipAddress || null,
        applicationData.userAgent || null
      ];

      const result = await client.query(query, values);
      const application = result.rows[0];

      // Log application creation
      await client.query(`
        INSERT INTO application_activity_log (application_id, action, actor_type, details)
        VALUES ($1, $2, $3, $4)
      `, [application.id, 'submitted', 'tenant', { ip_address: applicationData.ipAddress }]);

      await client.query('COMMIT');
      return application;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async findById(id) {
    const query = 'SELECT * FROM rental_applications WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByApplicationNumber(applicationNumber) {
    const query = 'SELECT * FROM rental_applications WHERE application_number = $1';
    const result = await pool.query(query, [applicationNumber]);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM rental_applications WHERE email = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, [email]);
    return result.rows;
  }

  static async findByLandlord(landlordId, status = null) {
    let query = 'SELECT * FROM rental_applications WHERE landlord_id = $1';
    const values = [landlordId];

    if (status) {
      query += ' AND application_status = $2';
      values.push(status);
    }

    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, values);
    return result.rows;
  }

  static async updateStatus(id, status, actorType = 'system', actorId = null) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update application status
      const updateQuery = `
        UPDATE rental_applications 
        SET application_status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;
      const result = await client.query(updateQuery, [status, id]);

      // Log status change
      await client.query(`
        INSERT INTO application_activity_log (application_id, action, actor_type, actor_id, details)
        VALUES ($1, $2, $3, $4, $5)
      `, [id, 'status_changed', actorType, actorId, { new_status: status }]);

      await client.query('COMMIT');
      return result.rows[0];

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async updateAIScore(id, score, breakdown = null) {
    const query = `
      UPDATE rental_applications 
      SET ai_score = $1, ai_score_breakdown = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;
    const result = await pool.query(query, [score, JSON.stringify(breakdown), id]);
    return result.rows[0];
  }

  static async getApplicationStats(landlordId = null) {
    let query = `
      SELECT 
        COUNT(*) as total_applications,
        COUNT(*) FILTER (WHERE application_status = 'pending') as pending,
        COUNT(*) FILTER (WHERE application_status = 'approved') as approved,
        COUNT(*) FILTER (WHERE application_status = 'rejected') as rejected,
        COUNT(*) FILTER (WHERE application_status = 'under_review') as under_review,
        AVG(ai_score) as avg_ai_score,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as recent_applications
      FROM rental_applications
    `;

    const values = [];
    if (landlordId) {
      query += ' WHERE landlord_id = $1';
      values.push(landlordId);
    }

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async searchApplications(searchParams) {
    let query = `
      SELECT ra.*, 
        CASE WHEN ra.ai_score IS NOT NULL 
          THEN 'scored' 
          ELSE 'unscored' 
        END as score_status
      FROM rental_applications ra
      WHERE 1=1
    `;
    
    const values = [];
    let paramCount = 0;

    // Add search filters
    if (searchParams.email) {
      paramCount++;
      query += ` AND ra.email ILIKE $${paramCount}`;
      values.push(`%${searchParams.email}%`);
    }

    if (searchParams.name) {
      paramCount++;
      query += ` AND ra.full_name ILIKE $${paramCount}`;
      values.push(`%${searchParams.name}%`);
    }

    if (searchParams.status) {
      paramCount++;
      query += ` AND ra.application_status = $${paramCount}`;
      values.push(searchParams.status);
    }

    if (searchParams.landlordId) {
      paramCount++;
      query += ` AND ra.landlord_id = $${paramCount}`;
      values.push(searchParams.landlordId);
    }

    if (searchParams.propertyId) {
      paramCount++;
      query += ` AND ra.property_id = $${paramCount}`;
      values.push(searchParams.propertyId);
    }

    if (searchParams.dateFrom) {
      paramCount++;
      query += ` AND ra.created_at >= $${paramCount}`;
      values.push(searchParams.dateFrom);
    }

    if (searchParams.dateTo) {
      paramCount++;
      query += ` AND ra.created_at <= $${paramCount}`;
      values.push(searchParams.dateTo);
    }

    // Pagination
    const limit = parseInt(searchParams.limit) || 50;
    const offset = parseInt(searchParams.offset) || 0;

    query += ` ORDER BY ra.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async delete(id) {
    const query = 'DELETE FROM rental_applications WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Validation helper methods
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePhone(phone) {
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  }

  static validateDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  }

  // Data transformation helpers
  static formatApplicationForPDF(application) {
    return {
      ...application,
      formattedDateOfBirth: new Date(application.date_of_birth).toLocaleDateString(),
      formattedDesiredMoveIn: new Date(application.desired_move_in_date).toLocaleDateString(),
      formattedCreatedAt: new Date(application.created_at).toLocaleString(),
      formattedIncome: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(application.monthly_gross_income)
    };
  }
}

module.exports = RentalApplication;