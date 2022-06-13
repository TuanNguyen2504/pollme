import { COOKIE } from '../constants';
import TagModel from '../models/tag.model';
import User from '../types/entities/User';
import { VoteFilterOptions } from './../constants/enum';
import { ExpressContext } from './../types/core/ExpressContext';
import findDescForTag from './find-tag-desc';
import { jwtAccessTokenEncode } from './jwt';

export const onLoginSuccess = ({ res }: ExpressContext, user: User) => {
	const { _id, name, avt, email } = user;
	const accessToken = jwtAccessTokenEncode({
		_id,
		name,
		avt,
		email,
	});
	res.cookie(COOKIE.ACCESS_KEY, accessToken, {
		maxAge: COOKIE.ACCESS_MAX_AGE,
		httpOnly: true,
	});
};

export const voteFilterToQuery = (filter: string): Object => {
	switch (filter) {
		case VoteFilterOptions.ALL:
			return {};
		case VoteFilterOptions.ACTIVE:
			return { $or: [{ endDate: null }, { endDate: { $gte: new Date() } }] };
		case VoteFilterOptions.CLOSED:
			return { endDate: { $lt: new Date() } };
		case VoteFilterOptions.UNVOTE:
			return { totalVote: 0 };
		default:
			return {};
	}
};

export const stringToSlug = (str: string): string => {
	var from =
			'àáãảạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệđùúủũụưừứửữựòóỏõọôồốổỗộơờớởỡợìíỉĩịäëïîöüûñçýỳỹỵỷ',
		to =
			'aaaaaaaaaaaaaaaaaeeeeeeeeeeeduuuuuuuuuuuoooooooooooooooooiiiiiaeiiouuncyyyyy';
	for (var i = 0, l = from.length; i < l; i++) {
		str = str.replace(RegExp(from[i], 'gi'), to[i]);
	}

	str = str
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\-]/g, '-')
		.replace(/-+/g, '-');

	return str;
};

export const randomString = (len: number = 30, charSet?: string): string => {
	charSet =
		charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let randomString = '';
	for (let i = 0; i < len; i++) {
		let randomPoz = Math.floor(Math.random() * charSet.length);
		randomString += charSet.substring(randomPoz, randomPoz + 1);
	}
	return randomString;
};

export const increaseTagOrCreate = async (tag: string) => {
	const existingTag = await TagModel.findOneAndUpdate(
		{ name: tag },
		{ $inc: { totalVote: 1 } },
	);

	if (!existingTag) {
		let viDesc = '',
			enDesc = '';

		const promises = [];
		promises.push(findDescForTag(tag, 'vi').then(desc => (viDesc = desc)));
		promises.push(findDescForTag(tag, 'en').then(desc => (enDesc = desc)));
		await Promise.all(promises);

		return await TagModel.create({
			name: tag.toLowerCase(),
			slug: stringToSlug(tag),
			viDesc,
			enDesc,
			totalVote: 1,
			createdAt: new Date(),
		});
	}

	return existingTag;
};
