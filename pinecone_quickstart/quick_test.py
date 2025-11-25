import os
import time
from typing import List, Dict, Any

from pinecone import Pinecone


def get_pinecone_client() -> Pinecone:
	api_key = os.getenv("PINECONE_API_KEY")
	if not api_key:
		raise ValueError("PINECONE_API_KEY environment variable not set")
	return Pinecone(api_key=api_key)


def build_sample_records() -> List[Dict[str, Any]]:
	return [
		{"_id": "rec1", "content": "The Eiffel Tower was completed in 1889 and stands in Paris, France.", "category": "history"},
		{"_id": "rec2", "content": "Photosynthesis allows plants to convert sunlight into energy.", "category": "science"},
		{"_id": "rec5", "content": "Shakespeare wrote many famous plays, including Hamlet and Macbeth.", "category": "literature"},
		{"_id": "rec7", "content": "The Great Wall of China was built to protect against invasions.", "category": "history"},
		{"_id": "rec15", "content": "Leonardo da Vinci painted the Mona Lisa.", "category": "art"},
		{"_id": "rec17", "content": "The Pyramids of Giza are among the Seven Wonders of the Ancient World.", "category": "history"},
		{"_id": "rec21", "content": "The Statue of Liberty was a gift from France to the United States.", "category": "history"},
		{"_id": "rec26", "content": "Rome was once the center of a vast empire.", "category": "history"},
		{"_id": "rec33", "content": "The violin is a string instrument commonly used in orchestras.", "category": "music"},
		{"_id": "rec38", "content": "The Taj Mahal is a mausoleum built by Emperor Shah Jahan.", "category": "history"},
		{"_id": "rec48", "content": "Vincent van Gogh painted Starry Night.", "category": "art"},
		{"_id": "rec50", "content": "Renewable energy sources include wind, solar, and hydroelectric power.", "category": "energy"},
	]


def upsert_records(index, namespace: str, records: List[Dict[str, Any]]) -> None:
	# Batch limits: 96 text records max
	index.upsert_records(namespace, records)


def print_results(label: str, results: Dict[str, Any]) -> None:
	print(f"\n=== {label} ===")
	hits = results.get("result", {}).get("hits", [])
	for hit in hits:
		_id = hit.get("_id", "")
		score = hit.get("_score", 0.0)
		fields = hit.get("fields", {})
		category = fields.get("category", "")
		content = fields.get("content", "")
		if len(content) > 120:
			content = content[:117] + "..."
		print(f"id: {_id:<6} | score: {round(score, 3):<6} | category: {category:<10} | text: {content}")


def main() -> None:
	pc = get_pinecone_client()

	index_name = "agentic-quickstart-test"
	namespace = "example-namespace"

	# Target existing index (created via CLI)
	index = pc.Index(index_name)

	# Prepare and upsert dataset
	records = build_sample_records()
	upsert_records(index, namespace, records)

	# Wait briefly for eventual consistency
	time.sleep(10)

	query_text = "Famous historical structures and monuments"

	# Initial semantic search
	results = index.search(
		namespace=namespace,
		query={
			"top_k": 10,
			"inputs": {
				"text": query_text
			}
		}
	)
	print_results("Initial semantic search", results)

	# Reranked search for better relevance
	reranked_results = index.search(
		namespace=namespace,
		query={
			"top_k": 10,
			"inputs": {
				"text": query_text
			}
		},
		rerank={
			"model": "bge-reranker-v2-m3",
			"top_n": 10,
			"rank_fields": ["content"]
		}
	)
	print_results("After reranking", reranked_results)


if __name__ == "__main__":
	main()


