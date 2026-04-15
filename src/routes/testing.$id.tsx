import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/testing/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  return (
    <div>
      Hello "/testing" ${id}
      <Link to="/">Go Home</Link>
    </div>
  )
}
