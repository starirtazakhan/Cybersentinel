function PlaceholderPage({ icon, title, description }) {
    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-2xl border border-slate-800 bg-[#07111f] text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-sky-500/20 bg-sky-500/5">
                {icon}
            </div>

            <h3 className="text-lg font-semibold text-white">
                {title}
            </h3>

            <p className="mt-2 max-w-sm text-sm text-slate-500">
                {description}
            </p>
        </div>
    );
}

export default PlaceholderPage;
