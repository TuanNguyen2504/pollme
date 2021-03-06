import Link from 'next/link';
import {
	USER_AVT_THUMBNAIL_HEIGHT,
	USER_AVT_THUMBNAIL_WIDTH,
} from '../constants';
import { DEFAULT } from '../constants/default';
import { PRIVATE_POLL_PARAM, QUERY_KEY } from '../constants/key';
import useLanguage from '../hooks/useLanguage';
import { dateFormat, optimizeCloudinarySrc } from '../utils/format';
import { isPollClosed } from '../utils/helper';

interface PollSummaryProps {
	pollId: string;
	pollSlug: string;
	title: string;
	content: string;
	user: {
		avt?: string;
		name: string;
	};
	maxVote?: number;
	createdAt: string | Date;
	endDate?: string | Date;
	tags: { slug: string; name: string }[];
	totalComment: number;
	totalVote: number;
	className?: string;
	hideOwner?: boolean;
	isPrivate?: boolean;
	privateLink?: string;
}

export default function PollSummary(props: PollSummaryProps): JSX.Element {
	const {
		content,
		pollId,
		pollSlug,
		title,
		tags,
		totalComment,
		maxVote,
		totalVote,
		createdAt,
		endDate,
		user,
		className = '',
		hideOwner = false,
		isPrivate = false,
		privateLink = '',
	} = props;

	const userAvt = user.avt
		? optimizeCloudinarySrc(
				user.avt,
				USER_AVT_THUMBNAIL_WIDTH,
				USER_AVT_THUMBNAIL_HEIGHT,
		  )
		: DEFAULT.USER_AVT;
	const isClosed = isPollClosed(endDate, maxVote, totalVote);
	const lang = useLanguage();
	const linkOfTag = `${lang.pages.discover.link}?${QUERY_KEY.SEARCH}=`;
	const pollUrl = isPrivate
		? `/poll/${PRIVATE_POLL_PARAM}/${privateLink}/${pollId}`
		: `/poll/${pollId}/${pollSlug}`;

	return (
		<div className={`poll-summary__bg flex flex-col space-y-2 ${className}`}>
			<div>
				<h3 className='poll-summary__title'>
					<Link href={pollUrl}>
						<a>
							{title}
							{isClosed && (
								<span className='ml-2 brightness-90'>
									{`[${lang.others.closed}]`}
								</span>
							)}
						</a>
					</Link>
				</h3>
				<p className='my-1 text-gray-600 line-clamp-2 dark:text-gray-400'>
					{content}
				</p>
			</div>

			<div className='mt-auto flex flex-grow flex-col justify-end'>
				<ul className='-mx-1 mb-3 flex flex-wrap xl:justify-start'>
					{tags.map((tag, index) => (
						<li className='tag-link m-1' key={index}>
							<Link href={`${linkOfTag}[${tag.name}]`}>{`#${tag.name}`}</Link>
						</li>
					))}
				</ul>
				<div className='flex flex-wrap items-center justify-between space-y-2'>
					<div className='flex items-center justify-end space-x-1 md:space-x-2 xl:col-span-2'>
						{!hideOwner && (
							<>
								<img
									src={userAvt}
									width={24}
									height={24}
									className='rounded-full'
								/>
								<span className='break-all text-sm'>{user.name}</span>
							</>
						)}
						<span
							className='text-sm text-gray-500'
							title={dateFormat(createdAt, true)}
						>
							{dateFormat(createdAt, false)}
						</span>
					</div>
					<div className='md:text-md text-right text-base font-medium text-gray-500 dark:text-gray-400'>
						<span className='mr-3'>{totalComment} Comments</span>
						<span>{totalVote} Votes</span>
					</div>
				</div>
			</div>
		</div>
	);
}
