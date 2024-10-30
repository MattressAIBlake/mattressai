interface Props {
  imageSrc: string;
  name: string;
}

export default function Avatar({ imageSrc, name }: Props) {
  return (
    <div className="flex items-center p-4 border-b">
      <img
        src={imageSrc}
        alt={`${name} avatar`}
        className="w-12 h-12 rounded-full mr-4"
      />
      <span className="font-bold text-xl">{name}</span>
    </div>
  );
}
