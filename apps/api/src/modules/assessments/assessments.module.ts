import { Module } from "@nestjs/common";
import { AssessmentsController } from "./assessments.controller";
import { AssessmentsService } from "./assessments.service";
import { AssignmentsController } from "./assignments.controller";
import { AssignmentsService } from "./assignments.service";
import { AttemptsController } from "./attempts.controller";
import { AttemptsService } from "./attempts.service";
import { QuestionsController } from "./questions.controller";
import { QuestionsService } from "./questions.service";
import { ResultsController } from "./results.controller";
import { ResultsService } from "./results.service";

@Module({
  controllers: [
    AssessmentsController,
    QuestionsController,
    AttemptsController,
    AssignmentsController,
    ResultsController,
  ],
  providers: [
    AssessmentsService,
    QuestionsService,
    AttemptsService,
    AssignmentsService,
    ResultsService,
  ],
  exports: [
    AssessmentsService,
    QuestionsService,
    AttemptsService,
    AssignmentsService,
    ResultsService,
  ],
})
export class AssessmentsModule {}
