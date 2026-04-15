import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/third/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/third/"!</div>
}
