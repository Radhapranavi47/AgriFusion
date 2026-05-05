import { Link, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ModalScreen() {
  const params = useLocalSearchParams();
  const advisory = (params.advisory as string) ?? '';

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">
        {advisory ? 'Advisory' : 'This is a modal'}
      </ThemedText>
      {advisory ? (
        <ScrollView style={styles.scroll}>
          <ThemedText>{advisory}</ThemedText>
        </ScrollView>
      ) : null}
      <Link href="/" dismissTo style={styles.link}>
        <ThemedText type="link">Close</ThemedText>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  scroll: {
    flex: 1,
    marginVertical: 16,
  },
  link: {
    paddingVertical: 15,
  },
});
