import { CogIcon, ShareIcon, TrashIcon } from '@heroicons/react/solid';
import { NextPage } from 'next';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Suspense, useEffect, useRef, useState } from 'react';
import Loading from '../../components/Loading';
import PollSummary from '../../components/PollSummary';
import {
	UpdateVoteInput,
	useDeleteVoteMutation,
	useGetVoteListOfUserQuery,
	Vote,
} from '../../graphql-client/generated/graphql';
import useCheckUserLogin from '../../hooks/useCheckUserLogin';
import useOnClickOutside from '../../hooks/useClickOutside';
import useLanguage from '../../hooks/useLanguage';
import useToast from '../../hooks/useToast';
import { createShareUrl } from '../../utils/helper';
import { deletePhotoFolder } from '../../utils/private-api-caller';
const EditVoteModal = dynamic(() => import('../../components/EditVoteModal'), {
	ssr: false,
	suspense: true,
});
const LinkShare = dynamic(() => import('../../components/LinkShare'), {
	ssr: false,
	suspense: true,
});

const AccountPolls: NextPage = () => {
	useCheckUserLogin({ isLoginPage: false });
	const lang = useLanguage();
	const pollLang = lang.pages.accountPolls;
	const { loading, data } = useGetVoteListOfUserQuery({
		fetchPolicy: 'no-cache',
	});
	const [votes, setVotes] = useState<Vote[]>([]);
	const [linkSharing, setLinkSharing] = useState('');
	const outsideRef = useRef(null);
	const [deleteVoteMutation] = useDeleteVoteMutation();
	const toast = useToast();
	const [editingVote, setEditingVote] = useState<Vote | null>(null);

	useEffect(() => {
		if (!loading && data?.votesOfUser?.votes) {
			setVotes([...(data.votesOfUser.votes as Vote[])]);
		}
	}, [loading, data]);

	useOnClickOutside(outsideRef, () => {
		setLinkSharing('');
	});

	const handleDeleteVote = async (voteId: string, ownerId: string) => {
		const isConfirmDel = confirm(pollLang.confirmDel);
		if (isConfirmDel) {
			const { data } = await deleteVoteMutation({ variables: { voteId } });
			if (data?.deleteVote.success) {
				toast.show({
					type: 'success',
					message: lang.messages.deleteVoteSuccess,
				});
				setVotes([...votes.filter(v => v._id !== voteId)]);
				await deletePhotoFolder(voteId, ownerId);
			} else {
				toast.show({ type: 'error', message: lang.messages.deleteVoteFailed });
			}
		}
	};

	const handleUpdateSuccess = ({
		voteId,
		...updatedValue
	}: UpdateVoteInput) => {
		const newVotes = votes.map(v =>
			v._id === voteId ? { ...v, ...updatedValue } : v,
		);
		setVotes([...newVotes]);
		setEditingVote(null);
	};

	return (
		<div className='container my-6'>
			<h1 className='font-normal md:col-span-4'>{pollLang.title}</h1>
			<h3 className='border-color border-b py-3 text-xl'>
				<strong className='text-accent dark:text-d_accent'>
					{votes?.length}
				</strong>
				&nbsp;
				<span className='font-normal text-text_primary dark:text-d_text_primary'>
					{lang.others.poll}
				</span>
			</h3>

			{loading ? (
				<Loading className='mt-5 w-24' />
			) : votes.length > 0 ? (
				<ul className='mt-5 grid grid-cols-1 gap-8 md:grid-cols-2'>
					{votes?.map(vote => (
						<li className='group relative h-full' key={vote._id}>
							<PollSummary
								className='h-full'
								hideOwner={true}
								content={vote.shortDesc || ''}
								title={vote.title}
								createdAt={vote.createdAt}
								pollId={vote._id}
								pollSlug={vote.slug}
								tags={vote.tags}
								totalComment={vote.totalComment}
								totalVote={vote.totalVote}
								endDate={vote.endDate}
								maxVote={vote.maxVote as number}
								user={{
									name: vote.owner!.name,
									avt: vote.owner?.avt as string,
								}}
								isPrivate={vote.isPrivate}
								privateLink={vote.privateLink!}
							/>

							<div className='absolute right-4 top-4 hidden space-x-2 group-hover:flex'>
								<CogIcon
									className='text-color-normal w-5 cursor-pointer duration-200 hover:brightness-75'
									onClick={() => setEditingVote(vote)}
								/>
								<TrashIcon
									className='error-text w-5 cursor-pointer duration-200 hover:brightness-75'
									onClick={() => handleDeleteVote(vote._id, vote.ownerId)}
								/>
								<ShareIcon
									className='w-5 cursor-pointer text-primary	duration-200 hover:brightness-75 dark:text-d_primary'
									onClick={() =>
										setLinkSharing(
											createShareUrl(
												vote.isPrivate,
												`${vote.privateLink}/${vote._id}`,
												`${vote._id}/${vote.slug}`,
											),
										)
									}
								/>
							</div>
						</li>
					))}
				</ul>
			) : (
				<Link href={lang.pages.newPoll.link}>
					<div className='text-center'>
						<button className='btn-primary btn-lg mt-5'>
							{lang.button.createPoll}
						</button>
					</div>
				</Link>
			)}

			{linkSharing && (
				<div className='bg-overlay'>
					<div
						className='transform-center w-[calc(100%-8px)] md:w-[600px]'
						ref={outsideRef}
					>
						<Suspense fallback={<Loading />}>
							<LinkShare
								className='bg-white dark:!border-none dark:bg-d_bg'
								url={linkSharing}
							/>
						</Suspense>
					</div>
				</div>
			)}

			{editingVote && (
				<Suspense fallback={<Loading />}>
					<EditVoteModal
						vote={editingVote}
						onClose={() => setEditingVote(null)}
						onUpdateSuccess={handleUpdateSuccess}
					/>
				</Suspense>
			)}
		</div>
	);
};

export default AccountPolls;
