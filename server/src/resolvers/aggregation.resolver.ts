import { Query, Resolver } from 'type-graphql';
import CommentModel from '../models/comment.model';
import TagModel from '../models/tag.model';
import UserModel from '../models/user.model';
import VoteModel from '../models/vote.model';
import { CountingAggregation } from '../types/response/AggregationResponse';

@Resolver()
export class AggregationResolver {
	@Query(_return => CountingAggregation)
	async count(): Promise<CountingAggregation> {
		let result: CountingAggregation = {
			code: 200,
			poll: 0,
			comment: 0,
			user: 0,
			tag: 0,
		};

		try {
			const promises = [];

			promises.push(
				VoteModel.countDocuments().then(nPoll => (result.poll = nPoll)),
			);
			promises.push(
				UserModel.countDocuments().then(nUser => (result.user = nUser)),
			);
			promises.push(
				CommentModel.countDocuments().then(
					nComment => (result.comment = nComment),
				),
			);
			promises.push(
				TagModel.countDocuments().then(nTag => (result.tag = nTag)),
			);

			await Promise.all(promises);
		} catch (error) {
			console.error('count - AggregationResolver Error: ', error);
		}

		return result;
	}
}
