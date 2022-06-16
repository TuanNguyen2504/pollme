import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useRecoilState } from 'recoil';
import LoginForm from '../components/LoginForm';
import { SUCCESS_CODE } from '../constants/status';
import {
	LoginInput,
	useLoginMutation,
	UserInfoFragment,
} from '../graphql-client/generated/graphql';
import useCheckUserLogin from '../hooks/useCheckUserLogin';
import useLanguage from '../hooks/useLanguage';
import useToast from '../hooks/useToast';
import userAtom from '../recoil/atoms/user.atom';

const Login: NextPage = () => {
	useCheckUserLogin({ isLoginPage: true });
	const lang = useLanguage();
	const toast = useToast();
	const loginLang = lang.pages.login;
	const router = useRouter();
	const [loginMutation] = useLoginMutation();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [userInfo, setUserInfoAtom] = useRecoilState(userAtom);

	const handleFormSubmit = async (loginInput: LoginInput) => {
		try {
			setIsSubmitting(true);
			const response = await loginMutation({ variables: { loginInput } });
			if (response.data?.login.code === SUCCESS_CODE.OK) {
				const user = response.data.login.user as UserInfoFragment;
				const { __typename, avt, ...rest } = user;
				setUserInfoAtom({ ...userInfo, ...rest, avt: avt as string });
				toast.show({
					type: 'success',
					message: loginLang.message.success(user.name),
				});
				router.push('/');
			} else {
				toast.show({
					type: 'error',
					message: response.data?.login.message || loginLang.message.failed,
				});
			}
		} catch (error) {
			toast.show({
				type: 'error',
				message: loginLang.message.failed,
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div
			className={`flex items-center flex-col my-16 ${
				isSubmitting ? 'disabled' : ''
			}`}
		>
			<h1 className='text-2xl md:text-4xl font-extrabold text-center tracking-[1px] mb-6'>
				{lang.pageSEO.login.title}
			</h1>

			<LoginForm onSubmit={handleFormSubmit} />
		</div>
	);
};

export default Login;
