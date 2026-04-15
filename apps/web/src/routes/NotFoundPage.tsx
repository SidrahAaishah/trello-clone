import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="h-full min-h-screen flex flex-col items-center justify-center bg-surface text-on-surface p-8">
      <div className="text-6xl font-black text-primary">404</div>
      <h1 className="text-xl font-bold mt-2">We can't find that board</h1>
      <p className="text-sm text-on-surface-variant mt-2 max-w-md text-center">
        The board you're looking for may have been archived or never existed. Head back to your
        boards and pick up where you left off.
      </p>
      <Link
        to="/boards"
        className="mt-6 bg-primary text-white font-semibold px-4 py-2 rounded-sm hover:bg-primary/90"
      >
        Back to boards
      </Link>
    </div>
  );
}
