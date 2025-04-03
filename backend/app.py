        response = model.generate_content(prompt)
        result = response.text.strip().lower()
        
        if result.startswith("biased: yes"):
            match = re.search(r"type:\s*(\w+)", result)
            bias_type = match.group(1) if match else "other"
            return True, bias_type
        else:
            return False, None
    except Exception as e:
        logger.error(f"Error in API bias detection: {e}")
        # Fallback keyword matching
        biased_keywords = {
            'gender': ['women can\'t', 'women should not', 'women are not', 'girls can\'t', 'females are', 'men always'],
            'racial': ['race', 'ethnic', 'minority'],
            'religious': ['religion', 'faith', 'belief', 'worship'],
            'age': ['too old', 'too young', 'age', 'elderly']
        }
        query_lower = user_query.lower()
        for bias_type, keywords in biased_keywords.items():
            if any(term in query_lower for term in keywords):
                logger.warning(f"Keyword bias detected (Type: {bias_type}) for query: {user_query}")
                return True, bias_type
        return False, None

def handle_bias() -> str:
    """Returns a standard response for biased queries."""
    return "I focus on providing inclusive and respectful information related to career development. Let's rephrase or explore a different topic."

# -----------------------------------------------------------------------------
