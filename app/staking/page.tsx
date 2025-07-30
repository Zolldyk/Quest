import StakingPage from '../../Frontend/src/pages/staking';

export const metadata = {
  title: 'Stake USDC - Quest DApp',
  description: 'Stake USDC to fund community quests and support the Quest ecosystem',
};

export const dynamic = 'force-dynamic';

export default function Staking() {
  return <StakingPage />;
}