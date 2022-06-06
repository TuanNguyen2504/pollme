import Image from 'next/image';
import React from 'react';
import { APP_NAME } from '../constants';

interface Contact {
	link: string;
	iconSrc: string;
}

const contacts: Contact[] = [
	{
		link: 'https://fb.com/TuanNguyen250400',
		iconSrc: '/icons/facebook.svg',
	},
	{
		link: 'https://www.linkedin.com/in/nlatuan/',
		iconSrc: '/icons/linkedin.svg',
	},
	{
		link: 'https://twitter.com/TunNguy73522840',
		iconSrc: '/icons/twitter.svg',
	},
	{
		link: 'https://github.com/TuanNguyen2504',
		iconSrc: '/icons/github.svg',
	},
	{
		link: 'https://dynonguyen.com',
		iconSrc: '/icons/blog.svg',
	},
];

export default function Footer(): JSX.Element {
	return (
		<footer className='bg-d_bg py-4 dark:border-t dark:border-gray-600'>
			<div className='container'>
				<div className='text-center'>
					<strong className='uppercase text-xl md:text-3xl text-white tracking-[1px]'>
						{APP_NAME}
					</strong>
				</div>
				<ul className='flex justify-center gap-3 md:gap-6 mt-3 mb-8'>
					{contacts.map((contact, index) => (
						<li key={index} className='rounded-full p-2 border cursor-pointer'>
							<a href={contact.link} target='_blank'>
								<div className='w-3 h-3 md:w-5 md:h-5 relative'>
									<Image
										src={contact.iconSrc}
										layout='fill'
										objectFit='contain'
									/>
								</div>
							</a>
						</li>
					))}
				</ul>
				<p className='text-white text-center text-sm md:text-lg'>
					Copyright© {new Date().getFullYear()} {APP_NAME}. All Rights Reserved.
				</p>
			</div>
		</footer>
	);
}
