/**
 * EditorLoader Component
 * Loading skeleton for the Unlayer editor initialization
 */

export function EditorLoader() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/95 backdrop-blur-sm z-10">
      <div className="text-center max-w-md px-4">
        <div className="relative mb-6">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-border border-t-primary mx-auto"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-6 w-6 rounded-full bg-primary/20 animate-pulse"></div>
          </div>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Loading Template Editor
        </h3>
        <p className="text-sm text-muted-foreground">
          Please wait while we initialize the editor...
        </p>
        <div className="mt-6 flex justify-center space-x-2">
          <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
}
