import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/users/schemas/user.schema';
import mongoose, { Model } from 'mongoose';
import { genSaltSync, hashSync, compareSync } from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) { }

  hashPassword = (password: string) => {
    const salt = genSaltSync(10);
    const hash = hashSync(password, salt);
    return hash;
  }


  // async create(email: string, password: string, name: string) {
  async create(createUserDto: CreateUserDto) {
    const hashedPassword = this.hashPassword(createUserDto.password);
    createUserDto.password = hashedPassword;
    let user = await this.userModel.create(createUserDto);
    return user;
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return 'Id không hợp lệ';
    }
    return this.userModel.findOne({
      _id: id
    });
  }

  findOneByUserName(username: string) {

    return this.userModel.findOne({
      email: username
    });
  }

  isValidPasswrod(password: string, hash: string) {
    return compareSync(password, hash);
  }

  async update(updateUserDto: UpdateUserDto) {
    let userUpdate = this.userModel.updateOne({
      _id: updateUserDto._id
    }, {
      ...updateUserDto
    })
    return userUpdate;
  }

  remove(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return 'Id không hợp lệ';
    }
    return this.userModel.deleteOne({
      _id: id
    });
  }
}
