import { atom } from 'recoil';

export interface UserAtom {
	_id: string;
	email: string;
	name: string;
	ip: string;
	avt?: string;
}

export const userAtomDefault: UserAtom = {
	_id: '',
	name: '',
	email: '',
	avt: '',
	ip: '',
};

const userAtom = atom<UserAtom>({
	key: 'user-state',
	default: userAtomDefault,
});

export default userAtom;
