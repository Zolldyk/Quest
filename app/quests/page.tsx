import QuestsPage from '../../Frontend/src/pages/quests';

export const metadata = {
  title: 'Complete Quests - Quest DApp',
  description: 'Complete community quests, earn USDC rewards, and mint unique NFT badges',
};

export const dynamic = 'force-dynamic';

export default function Quests() {
  return <QuestsPage />;
}