import { NextPage } from 'next';
import dynamic from 'next/dynamic';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useRecoilValue } from 'recoil';
import AnswerOptions from '../components/AnswerOptions';
import Button from '../components/core/Button';
import CheckboxSwitch from '../components/core/CheckboxSwitch';
import Select from '../components/core/Select';
import TagInput from '../components/core/TagInput';
import InfoTooltip from '../components/InfoTooltip';
import Loading from '../components/Loading';
import { VOTE_TYPE } from '../constants';
import { DEFAULT } from '../constants/default';
import { REDIS_KEY } from '../constants/key';
import { SUCCESS_CODE } from '../constants/status';
import { MAX } from '../constants/validation';
import {
	AnswerPhotoUpdateInput,
	useCreateVoteMutation,
	useUpdateAnswerPhotoMutation,
} from '../graphql-client/generated/graphql';
import useCheckUserLogin from '../hooks/useCheckUserLogin';
import useLanguage from '../hooks/useLanguage';
import useToast from '../hooks/useToast';
import userAtom from '../recoil/atoms/user.atom';
import { AdvanceVoteSettings, BasicVoteSettings } from '../types/vote-setting';
import { createShareUrl } from '../utils/helper';
import { redisDelete, uploadOptionPhoto } from '../utils/private-api-caller';
import { newPollValidate } from '../utils/validation';
const VOTE_DEFAULT = DEFAULT.VOTE;

const CreatePollSuccess = dynamic(
	() => import('../components/CreatePollSuccess'),
	{ ssr: false, suspense: true },
);

export interface NewPollFields extends BasicVoteSettings, AdvanceVoteSettings {}

const defaultBasicSettings: BasicVoteSettings = {
	title: '',
	answers: [],
	desc: '',
	tags: [],
};
const defaultAdvanceSettings: AdvanceVoteSettings = {
	type: VOTE_DEFAULT.TYPE,
	isPrivate: VOTE_DEFAULT.IS_PRIVATE,
	isReCaptcha: VOTE_DEFAULT.IS_RECAPTCHA,
	isIPDuplicationCheck: VOTE_DEFAULT.IS_IP_DUPLICATION_CHECK,
	isLoginRequired: VOTE_DEFAULT.IS_LOGIN_REQUIRED,
	isShowResult: VOTE_DEFAULT.SHOW_RESULT,
	isShowResultBtn: VOTE_DEFAULT.SHOW_RESULT_BTN,
	allowAddOption: VOTE_DEFAULT.ALLOW_ADD_OPTION,
};

const classes = {
	box: 'px-6 py-4 h-max shadow-md border-t border-gray-100 dark:border-none dark:bg-d_bg_hover rounded-md',
	h2: 'text-xl text-primary dark:text-d_primary mb-4',
	advanceInput: 'max-w-[200px] ml-auto',
};

const pollTypes: any = VOTE_TYPE;
const pollTypeOptions = Object.keys(pollTypes).map(key => ({
	label: key?.replace(/\_/gi, ' ').toLowerCase() || '',
	value: pollTypes[key],
}));

function BasicSettings({
	onCollectData,
}: {
	onCollectData?: (data: BasicVoteSettings) => void;
}): JSX.Element {
	const fields = useRef<BasicVoteSettings>(defaultBasicSettings);
	const lang = useLanguage();
	const newPollLang = lang.pages.newPoll;

	useEffect(() => {
		onCollectData && onCollectData(fields.current);
	}, [onCollectData]);

	return (
		<div className='grid gap-4'>
			{/* Title */}
			<div>
				<label htmlFor='title' className='new-poll-label'>
					{newPollLang.fieldLabels.title}
				</label>
				<input
					autoFocus
					id='title'
					type='text'
					maxLength={MAX.VOTE_TITLE}
					className='field mt-1'
					placeholder={newPollLang.placeholder.title}
					onChange={e => (fields.current.title = e.target.value.trim())}
				/>
			</div>
			{/* Desc */}
			<div>
				<label htmlFor='desc' className='new-poll-label'>
					{newPollLang.fieldLabels.desc}
				</label>
				<textarea
					id='desc'
					rows={3}
					maxLength={MAX.VOTE_DESC}
					className='field mt-1'
					placeholder={newPollLang.placeholder.desc}
					onChange={e => (fields.current.desc = e.target.value.trim())}
				/>
			</div>
			{/* Tag */}
			<div>
				<label htmlFor='tags' className='new-poll-label mb-1 inline-block'>
					{newPollLang.fieldLabels.tags}
				</label>
				<TagInput
					maxTags={MAX.VOTE_TAG}
					onChange={tags => (fields.current.tags = tags)}
				/>
			</div>
			{/* Answers */}
			<div>
				<label className='new-poll-label mb-1 inline-block'>
					{newPollLang.fieldLabels.answers}
				</label>
				<AnswerOptions
					onCollectData={answers => (fields.current.answers = answers)}
				/>
			</div>
		</div>
	);
}

function AdvanceSettings({
	onCollectData,
}: {
	onCollectData?: (data: AdvanceVoteSettings) => void;
}): JSX.Element {
	const fields = useRef<AdvanceVoteSettings>(defaultAdvanceSettings);
	const [pollType, setPollType] = useState(VOTE_DEFAULT.TYPE);
	const lang = useLanguage();
	const newPollLang = lang.pages.newPoll;

	useEffect(() => {
		onCollectData && onCollectData(fields.current);
	}, [onCollectData]);

	return (
		<div className='grid grid-cols-1 gap-4'>
			{/* Poll type */}
			<div className='flex items-center justify-between space-x-3'>
				<label htmlFor='poll-type' className='new-poll-label w-32 shrink-0'>
					{newPollLang.fieldLabels.type}
				</label>
				<Select
					selectProps={{ id: 'poll-type' }}
					className={`capitalize ${classes.advanceInput}`}
					optionItemClass='capitalize'
					options={pollTypeOptions}
					defaultValue={VOTE_DEFAULT.TYPE}
					onChange={type => {
						setPollType(Number(type));
						fields.current.type = Number(type);
					}}
				/>
			</div>

			{/* Max choice with VOTE_TYPE.SCORE */}
			{pollType === VOTE_TYPE.SCORE && (
				<div className='flex items-center justify-between space-x-3'>
					<label htmlFor='max-score' className={`new-poll-label w-32 shrink-0`}>
						{newPollLang.fieldLabels.maxScore}
					</label>
					<input
						id='max-score'
						type='number'
						className={`field ${classes.advanceInput}`}
						defaultValue={VOTE_DEFAULT.MAX_SCORE}
						onChange={e => (fields.current.maxScore = Number(e.target.value))}
					/>
				</div>
			)}

			{/* private */}
			<CheckboxSwitch
				labelClassName='new-poll-label'
				label={newPollLang.fieldLabels.isPrivate}
				helper={newPollLang.labelHelp.isPrivate}
				defaultChecked={VOTE_DEFAULT.IS_PRIVATE}
				onChecked={checked => (fields.current.isPrivate = checked)}
			/>
			{/* reCAPTCHA */}
			<CheckboxSwitch
				labelClassName='new-poll-label'
				label={newPollLang.fieldLabels.reCaptcha}
				helper={newPollLang.labelHelp.reCaptcha}
				defaultChecked={VOTE_DEFAULT.IS_RECAPTCHA}
				onChecked={checked => (fields.current.isReCaptcha = checked)}
			/>
			{/* IP Duplication Check */}
			<CheckboxSwitch
				labelClassName='new-poll-label'
				label={newPollLang.fieldLabels.ipCheck}
				helper={newPollLang.labelHelp.ipCheck}
				defaultChecked={VOTE_DEFAULT.IS_IP_DUPLICATION_CHECK}
				onChecked={checked => (fields.current.isIPDuplicationCheck = checked)}
			/>
			{/* Login required */}
			<CheckboxSwitch
				labelClassName='new-poll-label'
				label={newPollLang.fieldLabels.loginRequired}
				defaultChecked={VOTE_DEFAULT.IS_LOGIN_REQUIRED}
				onChecked={checked => (fields.current.isLoginRequired = checked)}
			/>
			{/* Show result */}
			<CheckboxSwitch
				labelClassName='new-poll-label'
				label={newPollLang.fieldLabels.showResult}
				helper={newPollLang.labelHelp.showResult}
				defaultChecked={VOTE_DEFAULT.SHOW_RESULT}
				onChecked={checked => (fields.current.isShowResult = checked)}
			/>
			{/* Show result button */}
			<CheckboxSwitch
				labelClassName='new-poll-label'
				label={newPollLang.fieldLabels.showResultBtn}
				helper={newPollLang.labelHelp.showResultBtn}
				defaultChecked={VOTE_DEFAULT.SHOW_RESULT_BTN}
				onChecked={checked => (fields.current.isShowResultBtn = checked)}
			/>
			{/* Allow add option */}
			<CheckboxSwitch
				labelClassName='new-poll-label'
				label={newPollLang.fieldLabels.allowAddOption}
				helper={newPollLang.labelHelp.allowAddOption}
				defaultChecked={VOTE_DEFAULT.ALLOW_ADD_OPTION}
				onChecked={checked => (fields.current.allowAddOption = checked)}
			/>
			{/* Max vote */}
			<div className='flex items-center justify-between space-x-3'>
				<div className='flex items-center space-x-1'>
					<label className={`new-poll-label w-max shrink-0`}>
						{newPollLang.fieldLabels.maxVote}
					</label>
					<InfoTooltip title={newPollLang.labelHelp.maxVote} />
				</div>
				<input
					type='number'
					className={`field ${classes.advanceInput}`}
					onChange={e => (fields.current.maxVote = Number(e.target.value))}
					min={1}
				/>
			</div>
			{/* End date */}
			<div className='flex items-center justify-between space-x-3'>
				<div className='flex items-center space-x-1'>
					<label className={`new-poll-label w-max shrink-0`}>
						{newPollLang.fieldLabels.endDate}
					</label>
					<InfoTooltip title={newPollLang.labelHelp.endDate} />
				</div>
				<input
					type='datetime-local'
					className={`field ${classes.advanceInput}`}
					onChange={e => (fields.current.endDate = new Date(e.target.value))}
				/>
			</div>
		</div>
	);
}

const NewVote: NextPage = () => {
	useCheckUserLogin({ isLoginPage: false });
	const userInfo = useRecoilValue(userAtom);
	const lang = useLanguage();
	const newPollLang = lang.pages.newPoll;
	const [isCollectData, setIsCollectData] = useState(false);
	const [createdPollLink, setCreatedPollLink] = useState('');
	const fields = useRef<NewPollFields>({
		...defaultBasicSettings,
		...defaultAdvanceSettings,
	});
	const toast = useToast();
	const [createVoteMutation] = useCreateVoteMutation();
	const [updateAnswerPhotoMutation] = useUpdateAnswerPhotoMutation();

	const createNewPoll = async () => {
		const { answers, ...restInput } = fields.current;

		try {
			const response = await createVoteMutation({
				variables: {
					newVoteInput: {
						answers: answers.map(answer => ({
							id: answer.id.toString(),
							label: answer.label,
							photo: null,
						})),
						...restInput,
					},
				},
			});
			if (response.data?.createVote.code === SUCCESS_CODE.CREATED) {
				const newVote = response.data.createVote.vote;
				const pollId = newVote!._id;

				// Upload option's photo to cloudinary
				let uploaded: AnswerPhotoUpdateInput[] = [];
				const promises: Promise<any>[] = [];
				answers.forEach(answer => {
					if (answer.photo) {
						promises.push(
							uploadOptionPhoto(
								answer.photo as string,
								userInfo._id,
								pollId,
							).then(response =>
								uploaded.push({ id: answer.id, photoSrc: response.photoUrl }),
							),
						);
					}
				});
				await Promise.all(promises);

				if (uploaded.length) {
					await updateAnswerPhotoMutation({
						variables: { updateInput: { answers: uploaded, voteId: pollId } },
					});
				}

				redisDelete(`${REDIS_KEY.DISCOVER}:*`, true);
				redisDelete(`${REDIS_KEY.TAGS}:*`, true);

				fields.current = {
					...defaultBasicSettings,
					...defaultAdvanceSettings,
				};

				const newPollUrl = createShareUrl(
					newVote?.isPrivate,
					`${newVote?.privateLink}/${pollId}`,
					`${pollId}/${newVote?.slug}`,
				);
				setCreatedPollLink(newPollUrl);
			} else {
				toast.show({ message: lang.messages.createVoteFailed, type: 'error' });
				setIsCollectData(false);
			}
		} catch (error) {
			toast.show({ message: lang.messages.createVoteFailed, type: 'error' });
			setIsCollectData(false);
		}
	};

	useEffect(() => {
		if (isCollectData) {
			const { isError, field = '' } = newPollValidate(fields.current);
			if (isError) {
				const filedError: any = newPollLang.fieldError;
				toast.show({ message: filedError[field], type: 'error' });
				setIsCollectData(false);
			} else {
				createNewPoll();
			}
		}
	}, [isCollectData]);

	return (
		<>
			{createdPollLink ? (
				<Suspense fallback={<Loading />}>
					<CreatePollSuccess url={createdPollLink} />
				</Suspense>
			) : (
				<div className={`container mb-5 ${isCollectData ? 'disabled' : ''}`}>
					<div className='bg-right-top bg-no-repeat py-5 md:py-0 lg:h-32 lg:bg-[url("/images/create-poll-bg.svg")] lg:dark:bg-[url("/images/create-poll-bg-dark.svg")]'>
						<h1 className='font-normal capitalize leading-[32px] md:leading-[64px] lg:leading-[128px]'>
							{newPollLang.title}
						</h1>
					</div>

					<div className='grid grid-cols-1 gap-5 lg:grid-cols-7'>
						<div className={`lg:col-span-4 ${classes.box}`}>
							<h2 className={classes.h2}>{newPollLang.basic}</h2>
							{isCollectData ? (
								<BasicSettings
									onCollectData={data =>
										(fields.current = { ...fields.current, ...data })
									}
								/>
							) : (
								<BasicSettings />
							)}
						</div>

						<div className={`lg:col-span-3 ${classes.box}`}>
							<h2 className={classes.h2}>{newPollLang.advance}</h2>
							<AdvanceSettings
								onCollectData={data =>
									(fields.current = { ...fields.current, ...data })
								}
							/>
							<div className='mt-3 text-right'>
								<Button
									className='w-full'
									onClick={() => setIsCollectData(true)}
									size='large'
									loading={isCollectData}
								>
									{newPollLang.submitBtn}
								</Button>
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export default NewVote;
