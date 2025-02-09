import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateSubscriberDto } from './dto/create-subscriber.dto';
import { UpdateSubscriberDto } from './dto/update-subscriber.dto';
import { IUser } from 'src/users/users.interface';
import { InjectModel } from '@nestjs/mongoose';
import { Subscriber, SubscriberDocument } from 'src/subscribers/schemas/subscriber.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import mongoose from 'mongoose';
import aqp from 'api-query-params';

@Injectable()
export class SubscribersService {
  constructor(@InjectModel(Subscriber.name) private subscriberModel: SoftDeleteModel<SubscriberDocument>) { }
  async create(createSubscriberDto: CreateSubscriberDto, user: IUser) {
    const isExist = await this.subscriberModel.findOne({ email: createSubscriberDto.email, isDeleted: false });
    if (isExist) {
      throw new BadRequestException('Email đã tồn tại');
    }
    let subscriber = await this.subscriberModel.create({ ...createSubscriberDto, createdBy: { _id: user._id, email: user.email } });
    return {
      _id: subscriber._id,
      createdAt: subscriber.createdAt,
    };
  }

  async findAll(currentPage: string, limit: string, qs: string) {
    const { filter, sort, population } = aqp(qs);
    delete filter.current;
    delete filter.pageSize;

    // let offset = (+currentPage - 1) * (+limit);
    // let defaultLimit = +limit ? +limit : 10;
    let defaultLimit = +limit ? +limit : 10;
    let offset = (+currentPage - 1) * defaultLimit;
    const totalItems = (await this.subscriberModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.subscriberModel.find(filter)
      .skip(offset)
      .limit(defaultLimit)
      .sort(sort as any)
      .populate(population)
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
    return this.subscriberModel.findById(id);
  }

  async update(id: string, updateSubscriberDto: UpdateSubscriberDto, user: IUser) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException("Id không hợp lệ");
    }
    let subUpdate = await this.subscriberModel.updateOne({ _id: id }, {
      ...updateSubscriberDto,
      updatedBy: {
        _id: user._id,
        email: user.email
      }
    })
    return subUpdate;
  }

  async remove(id: string, user: IUser) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException("Id không hợp lệ");
    }
    await this.subscriberModel.updateOne({ _id: id }, {
      deletedBy: {
        _id: user._id,
        email: user.email
      }
    })
    return this.subscriberModel.softDelete({ _id: id });
  }
}
