import { sealed } from "@/shared/utils/decorators/sealed";
import { IServiceHandlerAsync } from "@/shared/utils/helpers/services";
import { StatusEnum, UserCommunicationEntity, UserCredentialsEntity, UserEntity } from "@kishornaik/mma_db";
import { Service } from "typedi";
import { UpdateUserRequestDto } from "../../../contracts";
import { ResultError, ResultExceptionFactory } from "@/shared/utils/exceptions/results";
import { Ok, Result } from "neverthrow";
import { StatusCodes } from "http-status-codes";
import { IUsers } from "@/modules/users/shared/types";

export interface IMapUpdateUserRequestToEntityParameters{
  users:IUsers;
  request:UpdateUserRequestDto;
}

export interface IMapUpdateUserRequestToEntityResults{
  entity:{
    users:UserEntity;
    communication:UserCommunicationEntity;
    credentials:UserCredentialsEntity;
  }
}

export interface IMapUpdateUserRequestToEntityService extends IServiceHandlerAsync<IMapUpdateUserRequestToEntityParameters,IMapUpdateUserRequestToEntityResults>{}

@sealed
@Service()
export class MapUpdateUserRequestToEntityService implements IMapUpdateUserRequestToEntityService{

  public async handleAsync(params: IMapUpdateUserRequestToEntityParameters): Promise<Result<IMapUpdateUserRequestToEntityResults, ResultError>> {
    try
    {
      //@guard
      if(!params)
        return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST, 'Invalid params');

      if(!params.request)
        return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST,"Invalid request");

      if(!params.users)
        return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST,"Invalid users");

      const {request,users}=params;

      // Map Entity
      const userEntity:UserEntity=new UserEntity();
      userEntity.identifier=request.identifier;
      userEntity.status=users.status;
      userEntity.firstName=request.firstName;
      userEntity.lastName=request.lastName;
      userEntity.modified_date=new Date();

      const userCommunicationEntity:UserCommunicationEntity=new UserCommunicationEntity();
      userCommunicationEntity.identifier=users.communication.identifier;
      userCommunicationEntity.status=users.communication.status;
      userCommunicationEntity.email=request.email;
      userCommunicationEntity.mobileNo=request.mobileNo;
      userCommunicationEntity.modified_date=new Date();

      const userCredentialsEntity:UserCredentialsEntity=new UserCredentialsEntity();
      userCredentialsEntity.identifier=users.credentials.identifier;
      userCredentialsEntity.status=users.credentials.status;
      userCredentialsEntity.username=userCommunicationEntity.email;
      userCredentialsEntity.modified_date=new Date();

      const result:IMapUpdateUserRequestToEntityResults={
        entity:{
          users:userEntity,
          communication:userCommunicationEntity,
          credentials:userCredentialsEntity,
        }
      }
      return new Ok(result);
    }
    catch(ex){
      const error=ex as Error;
      return ResultExceptionFactory.error(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
  }

}
