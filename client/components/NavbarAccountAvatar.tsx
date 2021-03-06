import Link from 'next/link';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { DEFAULT } from '../constants/default';
import { LS_KEY } from '../constants/key';
import { useLogoutMutation } from '../graphql-client/generated/graphql';
import useLanguage from '../hooks/useLanguage';
import useToast from '../hooks/useToast';
import { MenuSliderAtom } from '../recoil/atoms/menu-slider.atom';
import userAtom, { userAtomDefault } from '../recoil/atoms/user.atom';
import { optimizeCloudinarySrc } from '../utils/format';
import { isIOSMacOSDevice } from '../utils/helper';

export default function NavbarAccountAvatar(): JSX.Element {
	const userInfo = useRecoilValue(userAtom);
	const [showMenu, setShowMenu] = useRecoilState(MenuSliderAtom);
	const userAvt = userInfo.avt
		? optimizeCloudinarySrc(userInfo.avt, 40, 40)
		: DEFAULT.USER_AVT;
	const lang = useLanguage();
	const { accountMenu } = lang;
	const [logoutMutation] = useLogoutMutation();
	const toast = useToast();
	const setUserInfoAtom = useSetRecoilState(userAtom);

	const onLogout = async () => {
		const response = await logoutMutation();
		// clear access token in local storage for IOS devices
		if (isIOSMacOSDevice())
			localStorage.removeItem(LS_KEY.ACCESS_TOKEN_FOR_IOS);

		if (response.data) {
			toast.show({ message: lang.messages.logoutSuccess, type: 'success' });
			setUserInfoAtom({ ...userAtomDefault, loading: false });
		}
	};

	return (
		<div className='group relative inline-block'>
			<img
				src={userAvt}
				className='h-10 w-10 cursor-pointer rounded-full'
				alt='Username'
				onError={e => (e.currentTarget.src = DEFAULT.USER_AVT)}
			/>
			<div className='menu left-0 z-[999] w-56 lg:right-0 lg:left-auto'>
				<ul>
					{accountMenu.map((item, index) => (
						<Link href={item.to} key={index}>
							<a
								className='menu-item'
								onClick={() => showMenu && setShowMenu(false)}
							>
								<li>{item.title}</li>
							</a>
						</Link>
					))}
					<li className='menu-item' onClick={onLogout}>
						{lang.button.logout}
					</li>
				</ul>
			</div>
		</div>
	);
}
