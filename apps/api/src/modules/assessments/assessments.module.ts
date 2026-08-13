import { Module } from "@nestjs/common";
import { AssessmentsController } from "./assessments.controller";
import { AssessmentsService } from "./assessments.service";
import { AssignmentsController } from "./assignments.controller";
import { AssignmentsService } from "./assignments.service";
import { AttemptsController } from "./attempts.controller";
import { AttemptsService } from "./attempts.service";
import { QuestionsController } from "./questions.controller";
import { QuestionsService } from "./questions.service";

@Module({
  controllers: [
    AssessmentsController,
    QuestionsController,
    AttemptsController,
    AssignmentsController,
  ],
  providers: [
    AssessmentsService,
    QuestionsService,
    AttemptsService,
    AssignmentsService,
  ],
  exports: [
    AssessmentsService,
    QuestionsService,
    AttemptsService,
    AssignmentsService,
  ],
})
export class AssessmentsModule {}
