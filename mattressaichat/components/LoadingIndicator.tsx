export default function LoadingIndicator({ message }: { message: string }) {
  return (
    <div className="flex justify-center items-center p-4">
      <p className="italic text-gray-500">{message}</p>
    </div>
  );
}
