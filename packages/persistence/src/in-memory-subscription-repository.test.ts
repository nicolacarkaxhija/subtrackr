import { InMemorySubscriptionRepository } from './in-memory-subscription-repository.js';
import { subscriptionRepositoryContract } from './subscription-repository.contract.js';

subscriptionRepositoryContract(
  'InMemorySubscriptionRepository',
  (clock) => new InMemorySubscriptionRepository(clock),
);
