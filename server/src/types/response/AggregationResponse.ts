import { Field, ObjectType } from 'type-graphql';
import { QueryResponse } from '../core/QueryResponse';

@ObjectType({ implements: QueryResponse })
export class CountingAggregation extends QueryResponse {
	@Field()
	poll: number;

	@Field()
	user: number;

	@Field()
	tag: number;

	@Field()
	comment: number;
}
