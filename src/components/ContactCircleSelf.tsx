import * as React from 'react'
import { ViewStyle } from 'react-native'
import { currentUserRecipientSelector } from 'src/account/selectors'
import ContactCircle from 'src/components/ContactCircle'
import { Recipient } from 'src/recipients/recipient'
import { useSelector } from 'src/redux/hooks'
import colors from 'src/styles/colors'

interface Props {
  style?: ViewStyle
  size?: number
  thumbnailPath?: string
}

// A contact circle for the wallet user themselves
export default function ContactCircleSelf({ style, size, thumbnailPath }: Props) {
  const recipient: Recipient = useSelector(currentUserRecipientSelector)

  return (
    <ContactCircle
      style={style}
      recipient={{
        ...recipient,
        thumbnailPath: thumbnailPath ?? recipient.thumbnailPath,
      }}
      size={size}
      backgroundColor={colors.gray1}
      borderColor={colors.gray2}
      foregroundColor={colors.black}
    />
  )
}
