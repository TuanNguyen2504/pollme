import bcrypt from 'bcrypt';
import { Arg, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql';
import UserModel from '../models/user.model';
import User from '../types/entities/User';
import { COOKIE, SALT_PASSWORD } from './../constants/index';
import { ERROR_CODE, SUCCESS_CODE } from './../constants/status';
import { ExpressContext } from './../types/core/ExpressContext';
import { ROLES } from './../types/core/Role';
import { LoginInput, OAuthLoginInput } from './../types/input/LoginInput';
import { RegisterInput } from './../types/input/RegisterInput';
import { UserMutationResponse } from './../types/response/UserResponse';
import { onLoginSuccess } from './../utils/helper';

@Resolver()
export class UserResolver {
	@Mutation(_return => UserMutationResponse)
	async register(
		@Arg('registerInput') { email, name, password }: RegisterInput,
	): Promise<UserMutationResponse> {
		try {
			const existingUser = await UserModel.findOne({ email });
			if (existingUser) {
				return {
					code: ERROR_CODE.BAD_REQUEST,
					success: false,
					message: 'Email already exists !',
				};
			}

			const hashedPassword = await bcrypt.hash(password, SALT_PASSWORD);
			const newUser = await UserModel.create({
				email,
				name,
				password: hashedPassword,
			});

			return { user: newUser, code: SUCCESS_CODE.CREATED, success: true };
		} catch (error) {
			console.log('USER_RESOLVER - REGISTER MUTATION FAILED:', error);
			return {
				code: ERROR_CODE.INTERNAL_ERROR,
				success: false,
				message: 'Registration failed',
			};
		}
	}

	@Mutation(_return => UserMutationResponse)
	async login(
		@Arg('loginInput') { email, password }: LoginInput,
		@Ctx() { res, req }: ExpressContext,
	): Promise<UserMutationResponse> {
		try {
			const existingUser = await UserModel.findOne({ email });
			if (!existingUser) {
				return {
					code: ERROR_CODE.NOT_FOUND,
					success: false,
					message: 'Account does not exist !',
				};
			}

			const { password: hashPwd } = existingUser;
			const isPwdCorrect = await bcrypt.compare(password, hashPwd as string);

			if (!isPwdCorrect) {
				return {
					code: ERROR_CODE.UNAUTHORIZED,
					success: false,
					message: 'Wrong password !',
				};
			}

			onLoginSuccess({ req, res }, existingUser);
			return {
				code: SUCCESS_CODE.OK,
				success: true,
				user: existingUser,
			};
		} catch (error) {
			console.log('USER_RESOLVER - LOGIN MUTATION FAILED:', error);
			return {
				code: ERROR_CODE.INTERNAL_ERROR,
				success: false,
				message: 'Login failed',
			};
		}
	}

	@Mutation(_return => Boolean)
	logout(@Ctx() { res }: ExpressContext): boolean {
		res.clearCookie(COOKIE.ACCESS_KEY);
		return true;
	}

	@Mutation(_return => UserMutationResponse)
	async loginWithOAuth(
		@Arg('loginInput') { email, avt, name, oauthId }: OAuthLoginInput,
		@Ctx() { res, req }: ExpressContext,
	): Promise<UserMutationResponse> {
		try {
			const existingUser = await UserModel.findOne({ email });
			let user = existingUser;

			if (!user) {
				user = await UserModel.create({ name, avt, oauthId, email });
			}

			onLoginSuccess({ res, req }, user);
			return {
				code: SUCCESS_CODE.OK,
				success: true,
				user,
			};
		} catch (error) {
			console.log('USER_RESOLVER - OAUTH LOGIN MUTATION FAILED:', error);
			return {
				code: ERROR_CODE.INTERNAL_ERROR,
				success: false,
				message: 'Login failed',
			};
		}
	}

	@Query(_return => User, { nullable: true })
	async user(@Arg('userId') userId: String): Promise<User | null> {
		try {
			const user = await UserModel.findById(userId);
			return user;
		} catch (error) {
			console.log('USER_RESOLVER - USER QUERY FAILED:', error);
			return null;
		}
	}

	@Authorized([ROLES.USER, ROLES.ADMIN])
	@Query(_return => User, { nullable: true })
	me(@Ctx() { res }: ExpressContext): User | null {
		const { user } = res.locals;
		if (user) return user;
		return null;
	}
}