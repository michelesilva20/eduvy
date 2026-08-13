import { Module } from "@nestjs/common";
import { AssessmentsController } from "./assessments.controller";
import { AssessmentsService } from "./assessments.service";
import { QuestionsController } from "./questions.controller";
import { QuestionsService } from "./questions.service";

@Module({
  controllers: [AssessmentsController, QuestionsController],
  providers: [AssessmentsService, QuestionsService],
  exports: [AssessmentsService, QuestionsService],
})
export class AssessmentsModule {}
