import { Component } from "react";
import { Button } from "@/components/ui/button";

// Los error boundaries de React solo se pueden escribir como clase: no hay
// equivalente en hooks (getDerivedStateFromError/componentDidCatch).
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Error no controlado en la UI:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-20 text-center">
          <h1 className="text-xl font-bold">Se rompió algo por acá</h1>
          <p className="text-muted-foreground">
            Probá recargar la página. Si el problema sigue, avisanos qué estabas haciendo.
          </p>
          <Button onClick={() => window.location.reload()}>Recargar página</Button>
        </main>
      );
    }

    return this.props.children;
  }
}
