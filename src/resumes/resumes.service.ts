import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateResumeDto, CreateUserCVDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';
import { IUser } from 'src/users/users.interface';
import { InjectModel } from '@nestjs/mongoose';
import { Resume, ResumeDocument } from 'src/resumes/schemas/resume.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import aqp from 'api-query-params';
import mongoose from 'mongoose';

@Injectable()
export class ResumesService {
  constructor(@InjectModel(Resume.name) private resumeModel: SoftDeleteModel<ResumeDocument>) { }

  async create(createResumeDto: CreateUserCVDto, user: IUser) {
    return await this.resumeModel.create({
      ...createResumeDto,
      userId: user._id,
      email: user.email,
      status: "PENDING",
      history: [{
        status: "PENDING",
        updatedAt: new Date(),
        updatedBy: {
          _id: user._id,
          email: user.email
        }
      }],
      createdBy: {
        _id: user._id,
        email: user.email
      }
    });

  }

  async findAll(currentPage: number, limit: number, qs: string) {

    const { filter, sort, population, projection } = aqp(qs);
    delete filter.current;
    delete filter.pageSize;

    console.log(filter, sort, population, projection);

    // let offset = (+currentPage - 1) * (+limit);
    // let defaultLimit = +limit ? +limit : 10;
    let defaultLimit = +limit ? +limit : 10;
    let offset = (+currentPage - 1) * defaultLimit;
    const totalItems = (await this.resumeModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.resumeModel.find(filter)
      .skip(offset)
      .limit(defaultLimit)
      .sort(sort as any)
      .populate(population)
      .select(projection)
      .exec();

    return {
      meta: {
        current: currentPage, //trang hiện tại
        pageSize: limit, //số lượng bản ghi đã lấy
        pages: totalPages, //tổng số trang với điều kiện query
        total: totalItems // tổng số phần tử (số bản ghi)
      },
      result //kết quả query
    }


  }

  findOne(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException("Id không hợp lệ");
    }
    return this.resumeModel.findById(id);
  }

  update(id: string, updateResumeDto: UpdateResumeDto, user: IUser) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException("Id không hợp lệ");
    }
    const { status } = updateResumeDto;
    return this.resumeModel.updateOne({ _id: id }, {
      status,
      $push: {
        history: {
          status,
          updatedAt: new Date(),
          updatedBy: {
            _id: user._id,
            email: user.email
          }
        }
      },
      updatedBy: {
        _id: user._id,
        email: user.email
      }
    });
  }

  async remove(id: string, user: IUser) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException("Id không hợp lệ");
    }
    await this.resumeModel.updateOne({ _id: id }, {
      deletedBy: {
        _id: user._id,
        email: user.email
      }
    })
    return this.resumeModel.softDelete({ _id: id });
  }

  findResumesByUser = async (user: IUser) => {
    return await this.resumeModel.find({
      userId: user._id
    })
  }
}
