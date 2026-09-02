import { Controller, Get, Post, Body } from '@nestjs/common';
import { StudentsService, CreateStudentDto } from './students.service';

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  async getStudents() {
    const data = await this.studentsService.findAll();
    return {
      success: true,
      count: data.length,
      data,
    };
  }

  @Post()
  async createStudent(@Body() dto: CreateStudentDto) {
    const created = await this.studentsService.create(dto);
    return {
      success: true,
      data: created[0],
    };
  }
}
