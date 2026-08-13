import { Module } from "@nestjs/common";
import {
  InstructorsController,
  InvitationsController,
  StudentsController,
} from "./people.controller";
import { PeopleService } from "./people.service";

@Module({
  controllers: [StudentsController, InstructorsController, InvitationsController],
  providers: [PeopleService],
  exports: [PeopleService],
})
export class PeopleModule {}
