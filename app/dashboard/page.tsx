import DashboardPage from '../../Frontend/src/pages/dashboard';

export const metadata = {
  title: 'Dashboard - Quest DApp',
  description: 'View your quest activity, stakes, rewards, and NFT collection',
};

export const dynamic = 'force-dynamic';

export default function Dashboard() {
  return <DashboardPage />;
}