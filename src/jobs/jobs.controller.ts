import { Controller, Get, Post, Body, Patch, Param, Delete, Res, Query } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { ResponseMessage, User } from 'src/decorator/customize';
import { IUser } from 'src/users/users.interface';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) { }

  @Post()
  @ResponseMessage("Create a new Job")
  async create(@Body() createJobDto: CreateJobDto, @User() user: IUser) {
    let job = await this.jobsService.create(createJobDto, user);
    return {
      _id: job?._id,
      createdAt: job?.createdAt
    }
  }

  @Get()
  findAll(
    @Query("current") currentPage: string,
    @Query("pageSize") limit: string,
    @Query() qs: string) {
    return this.jobsService.findAll(currentPage, limit, qs);
  }

  @Get(':id')
  @ResponseMessage("Get Job by id")
  findOne(@Param('id') id: string) {

    return this.jobsService.findOne(id);
  }

  @Patch(':id')
  @ResponseMessage("Update Job")
  update(@Param('id') id: string, @Body() updateJobDto: UpdateJobDto, @User() user: IUser) {
    return this.jobsService.update(id, updateJobDto, user);
  }

  @Delete(':id')
  @ResponseMessage("Delete Job")
  remove(@Param('id') id: string, @User() user: IUser) {
    return this.jobsService.remove(id, user);
  }
}
