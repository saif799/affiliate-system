import { createFileRoute } from '@tanstack/react-router'
import { NotificationsView } from './-components/NotificationsView'

export const Route = createFileRoute('/affiliate/notifications/')({
  component: NotificationsView,
})
