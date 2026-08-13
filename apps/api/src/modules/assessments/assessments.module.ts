import { Module } from "@nestjs/common";
import { AssessmentsController } from "./assessments.controller";
import { AssessmentsService } from "./assessments.service";
import { AttemptsController } from "./attempts.controller";
import { AttemptsService } from "./attempts.service";
import { QuestionsController } from "./questions.controller";
import { QuestionsService } from "./questions.service";

@Module({
  controllers: [AssessmentsController, QuestionsController, AttemptsController],
  providers: [AssessmentsService, QuestionsService, AttemptsService],
  exports: [AssessmentsService, QuestionsService, AttemptsService],
})
export class AssessmentsModule {}
