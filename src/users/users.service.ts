import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from 'src/users/schemas/user.schema';
import mongoose, { Model } from 'mongoose';
import { genSaltSync, hashSync, compareSync } from 'bcrypt';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { IUser } from 'src/users/users.interface';
import aqp from 'api-query-params';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: SoftDeleteModel<UserDocument>) { }

  hashPassword = (password: string) => {
    const salt = genSaltSync(10);
    const hash = hashSync(password, salt);
    return hash;
  }


  // async create(email: string, password: string, name: string) {
  async create(createUserDto: CreateUserDto, user: IUser) {
    let userExist = await this.findOneByUserName(createUserDto.email);
    if (userExist) {
      throw new BadRequestException("User already exist");
    }
    const hashedPassword = this.hashPassword(createUserDto.password);
    createUserDto.password = hashedPassword;
    let newUser = await this.userModel.create({
      ...createUserDto,
      createdBy: {
        _id: user._id,
        email: user.email
      }
    });
    return newUser;
  }

  async findAll(currentPage: string, limit: string, qs: string) {
    const { filter, sort, population } = aqp(qs);
    delete filter.current;
    delete filter.pageSize;

    // let offset = (+currentPage - 1) * (+limit);
    // let defaultLimit = +limit ? +limit : 10;
    let defaultLimit = +limit ? +limit : 10;
    let offset = (+currentPage - 1) * defaultLimit;
    const totalItems = (await this.userModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.userModel.find(filter)
      .select('-password')
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
    // không trả về password
    return this.userModel.findOne({
      _id: id
    })
      .select('-password')
      .populate({ path: 'role', select: { _id: 1, name: 1 } });





    // return this.userModel.findOne({
    //   _id: id
    // });
  }

  findOneByUserName(username: string) {

    return this.userModel.findOne({
      email: username
    })
      .populate({ path: 'role', select: { _id: 1, name: 1 } });
  }

  isValidPasswrod(password: string, hash: string) {
    return compareSync(password, hash);
  }

  async update(updateUserDto: UpdateUserDto, user: IUser) {
    let userExist = await this.findOneByUserName(updateUserDto.email);
    if (userExist) {
      throw new BadRequestException("User already exist");
    }
    let userUpdate = this.userModel.updateOne({
      _id: updateUserDto._id
    }, {
      ...updateUserDto,
      updatedBy: {
        _id: user._id,
        email: user.email
      }
    })
    return userUpdate
  }

  async remove(id: string, user: IUser) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException("Id không hợp lệ");
    }

    const foundUser = await this.userModel.findById(id);
    if (foundUser?.email === "admin@gmail.com") {
      throw new BadRequestException("Không thể xóa tài khoản admin");
    }
    await this.userModel.updateOne({ _id: id }, {
      deletedBy: {
        _id: user._id,
        email: user.email
      }
    })
    return this.userModel.softDelete({
      _id: id
    });
  }

  updateUserWithToken = async (refreshToken: string, _id: string) => {
    return await this.userModel.updateOne({ _id }, {
      refreshToken
    });
  }

  findUserByToken = async (refreshToken: string) => {
    return await this.userModel.findOne({ refreshToken });
  }
}
