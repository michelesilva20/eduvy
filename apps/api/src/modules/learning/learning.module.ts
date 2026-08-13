import { Module } from "@nestjs/common";
import { CohortProgressController } from "./cohort-progress.controller";
import { LearningController } from "./learning.controller";
import { LearningService } from "./learning.service";

@Module({
  controllers: [LearningController, CohortProgressController],
  providers: [LearningService],
  exports: [LearningService],
})
export class LearningModule {}