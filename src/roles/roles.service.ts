import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { IUser } from 'src/users/users.interface';
import { InjectModel } from '@nestjs/mongoose';
import { Job, JobDocument } from 'src/jobs/schemas/job.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { Role, RoleDocument } from 'src/roles/schemas/role.schema';
import { User } from 'src/decorator/customize';
import aqp from 'api-query-params';
import mongoose from 'mongoose';

@Injectable()
export class RolesService {
  constructor(@InjectModel(Role.name) private roleModel: SoftDeleteModel<RoleDocument>) { }
  async create(createRoleDto: CreateRoleDto, user: IUser) {
    const isExist = await this.roleModel.exists({ name: createRoleDto.name });
    if (isExist) {
      throw new BadRequestException('Role already exist');
    }
    return this.roleModel.create({ ...createRoleDto, createdBy: { _id: user._id, email: user.email } });
  }

  async findAll(currentPage: string, limit: string, qs: string) {
    const { filter, sort, population } = aqp(qs);
    delete filter.current;
    delete filter.pageSize;

    // let offset = (+currentPage - 1) * (+limit);
    // let defaultLimit = +limit ? +limit : 10;
    let defaultLimit = +limit ? +limit : 10;
    let offset = (+currentPage - 1) * defaultLimit;
    const totalItems = (await this.roleModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.roleModel.find(filter)
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
    // populate để ref tới schema permission và lấy ra các trường cần thiết (lấy = select 1, ko lấy = -1)
    return this.roleModel.findById(id)
      .populate({ path: 'permissions', select: { _id: 1, apiPath: 1, name: 1, method: 1, module: 1 } });
  }

  async update(id: string, updateRoleDto: UpdateRoleDto, user: IUser) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException("Id không hợp lệ");
    }

    return this.roleModel.updateOne({ _id: id }, { ...updateRoleDto, updatedBy: { _id: user._id, email: user.email } });
  }

  async remove(id: string, user: IUser) {
    const foundRole = await this.roleModel.findById(id);
    if (foundRole && foundRole.name === "ADMIN") {
      throw new BadRequestException("Không thể xóa role ADMIN");
    }
    await this.roleModel.updateOne({ _id: id }, { deletedBy: { _id: user._id, email: user.email } });
    return this.roleModel.softDelete({ _id: id });
  }
}
