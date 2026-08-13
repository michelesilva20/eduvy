import { Module } from "@nestjs/common";
import { CourseContentController } from "./course-content.controller";
import { CourseContentService } from "./course-content.service";
import { CoursesController } from "./courses.controller";
import { CoursesService } from "./courses.service";

@Module({
  controllers: [CoursesController, CourseContentController],
  providers: [CoursesService, CourseContentService],
  exports: [CoursesService, CourseContentService],
})
export class CoursesModule {}
