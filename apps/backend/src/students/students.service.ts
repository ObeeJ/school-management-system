import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface CreateStudentDto {
  student_code: string;
  first_name: string;
  last_name: string;
  grade_level: string;
}

@Injectable()
export class StudentsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll() {
    // Queries database. Row-Level Security automatically restricts returned rows to active tenant.
    return this.db.queryTenantScoped(
      'SELECT id, tenant_id, student_code, first_name, last_name, grade_level, created_at FROM students ORDER BY created_at DESC'
    );
  }

  async create(dto: CreateStudentDto) {
    return this.db.queryTenantScoped(
      `INSERT INTO students (student_code, first_name, last_name, grade_level)
       VALUES ($1, $2, $3, $4)
       RETURNING id, tenant_id, student_code, first_name, last_name, grade_level, created_at`,
      [dto.student_code, dto.first_name, dto.last_name, dto.grade_level]
    );
  }
}
