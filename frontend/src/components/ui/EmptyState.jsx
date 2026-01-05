export default function EmptyState({ icon: Icon, title, description, action, actionText }) {
    return (
        <div className="text-center py-12">
            {Icon && (
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-50 flex items-center justify-center">
                    <Icon className="w-8 h-8 text-primary-500" />
                </div>
            )}
            {title && (
                <h3 className="text-xl font-heading font-bold text-neutral-900 mb-2">
                    {title}
                </h3>
            )}
            {description && (
                <p className="text-neutral-600 mb-6 max-w-md mx-auto">
                    {description}
                </p>
            )}
            {action && actionText && (
                <button onClick={action} className="btn-primary">
                    {actionText}
                </button>
            )}
        </div>
    )
}
