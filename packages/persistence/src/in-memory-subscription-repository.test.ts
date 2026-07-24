import { InMemorySubscriptionRepository } from './in-memory-subscription-repository';
import { subscriptionRepositoryContract } from './subscription-repository.contract';

subscriptionRepositoryContract(
  'InMemorySubscriptionRepository',
  (clock) => new InMemorySubscriptionRepository(clock),
);
